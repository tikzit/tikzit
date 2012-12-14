/*
 * Copyright 2012  Alex Merry <dev@randomguy3.me.uk>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#import "EdgeStyleSelector.h"

#import "CairoRenderContext.h"
#import "Edge.h"
#import "Edge+Render.h"
#import "Node.h"
#import "Shape.h"
#import "Shape+Render.h"
#import "ShapeNames.h"
#import "StyleManager.h"

#import "gtkhelpers.h"

#import <gdk-pixbuf/gdk-pixbuf.h>

// {{{ Internal interfaces
// {{{ Signals
static void selection_changed_cb (GtkTreeSelection *sel, EdgeStyleSelector *mgr);
// }}}

enum {
    STYLES_NAME_COL = 0,
    STYLES_ICON_COL,
    STYLES_PTR_COL,
    STYLES_N_COLS
};

@interface EdgeStyleSelector (Notifications)
- (void) stylesReplaced:(NSNotification*)notification;
- (void) styleAdded:(NSNotification*)notification;
- (void) styleRemoved:(NSNotification*)notification;
- (void) shapeDictionaryReplaced:(NSNotification*)n;
- (void) selectionChanged;
- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context;
@end

@interface EdgeStyleSelector (Private)
- (void) clearModel;
- (cairo_surface_t*) createEdgeIconSurface;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) addStyle:(EdgeStyle*)style;
- (void) observeStyle:(EdgeStyle*)style;
- (void) stopObservingStyle:(EdgeStyle*)style;
- (void) reloadStyles;
@end

// }}}
// {{{ API

@implementation EdgeStyleSelector

- (id) init {
    self = [self initWithStyleManager:[StyleManager manager]];
    return self;
}

- (id) initWithStyleManager:(StyleManager*)m {
    self = [super init];

    if (self) {
        styleManager = nil;

        store = gtk_list_store_new (STYLES_N_COLS,
                                    G_TYPE_STRING,
                                    GDK_TYPE_PIXBUF,
                                    G_TYPE_POINTER);
        g_object_ref (store);

        view = GTK_TREE_VIEW (gtk_tree_view_new_with_model (GTK_TREE_MODEL (store)));
        gtk_tree_view_set_headers_visible (view, FALSE);
        g_object_ref (view);

        GtkCellRenderer *renderer;
        GtkTreeViewColumn *column;
        renderer = gtk_cell_renderer_pixbuf_new ();
        column = gtk_tree_view_column_new_with_attributes ("Preview",
                                                           renderer,
                                                           "pixbuf", STYLES_ICON_COL,
                                                           NULL);
        gtk_tree_view_append_column (view, column);
        gtk_tree_view_set_tooltip_column (view, STYLES_NAME_COL);

        GtkTreeSelection *sel = gtk_tree_view_get_selection (view);
        gtk_tree_selection_set_mode (sel, GTK_SELECTION_SINGLE);

        g_signal_connect (G_OBJECT (sel),
                          "changed",
                          G_CALLBACK (selection_changed_cb),
                          self);

        [self setStyleManager:m];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(shapeDictionaryReplaced:)
                                                     name:@"ShapeDictionaryReplaced"
                                                   object:[Shape class]];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    g_object_unref (view);
    [self clearModel];
    g_object_unref (store);
    [styleManager release];

    [super dealloc];
}

- (StyleManager*) styleManager {
    return styleManager;
}

- (void) setStyleManager:(StyleManager*)m {
    if (m == nil) {
        [NSException raise:NSInvalidArgumentException format:@"Style manager cannot be nil"];
    }
    [m retain];

    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:styleManager];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(stylesReplaced:)
                                                 name:@"EdgeStylesReplaced"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(styleAdded:)
                                                 name:@"EdgeStyleAdded"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(styleRemoved:)
                                                 name:@"EdgeStyleRemoved"
                                               object:m];

    [styleManager release];
    styleManager = m;

    [self reloadStyles];
}

- (GtkWidget*) widget {
    return GTK_WIDGET (view);
}

- (EdgeStyle*) selectedStyle {
    GtkTreeSelection *sel = gtk_tree_view_get_selection (view);
    GtkTreeIter iter;

    if (!gtk_tree_selection_get_selected (sel, NULL, &iter)) {
        return nil;
    }

    EdgeStyle *style = nil;
    gtk_tree_model_get (GTK_TREE_MODEL (store), &iter, STYLES_PTR_COL, &style, -1);

    return style;
}

- (void) setSelectedStyle:(EdgeStyle*)style {
    GtkTreeSelection *sel = gtk_tree_view_get_selection (view);

    if (style == nil) {
        gtk_tree_selection_unselect_all (sel);
        return;
    }

    GtkTreeModel *m = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (m, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (m, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                gtk_tree_selection_unselect_all (sel);
                GtkTreePath *path = gtk_tree_model_get_path (m, &row);
                gtk_tree_selection_select_path (sel, path);
                gtk_tree_path_free (path);
                // styleManager.activeStyle will be updated by the GTK+ callback
                return;
            }
        } while (gtk_tree_model_iter_next (m, &row));
    }
}

@end

// }}}
// {{{ Notifications

@implementation EdgeStyleSelector (Notifications)

- (void) stylesReplaced:(NSNotification*)notification {
    [self reloadStyles];
}

- (void) styleAdded:(NSNotification*)notification {
    [self addStyle:[[notification userInfo] objectForKey:@"style"]];
}

- (void) styleRemoved:(NSNotification*)notification {
    EdgeStyle *style = [[notification userInfo] objectForKey:@"style"];

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                gtk_list_store_remove (store, &row);
                [self stopObservingStyle:rowStyle];
                [rowStyle release];
                return;
            }
        } while (gtk_tree_model_iter_next (model, &row));
    }
}

- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context
{
    if ([object class] != [EdgeStyle class])
        return;

    EdgeStyle *style = object;

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                if ([@"name" isEqual:keyPath]) {
                    gtk_list_store_set (store, &row, STYLES_NAME_COL, [[style name] UTF8String], -1);
                } else {
                    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style];
                    gtk_list_store_set (store, &row, STYLES_ICON_COL, pixbuf, -1);
                    g_object_unref (pixbuf);
                }
            }
        } while (gtk_tree_model_iter_next (model, &row));
    }
}

- (void) shapeDictionaryReplaced:(NSNotification*)n {
    [self reloadStyles];
}

- (void) selectionChanged {
    [[NSNotificationCenter defaultCenter]
        postNotificationName:@"SelectedStyleChanged"
                      object:self];
}
@end

// }}}
// {{{ Private

@implementation EdgeStyleSelector (Private)
- (void) clearModel {
    [self setSelectedStyle:nil];
    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            [self stopObservingStyle:rowStyle];
            [rowStyle release];
        } while (gtk_tree_model_iter_next (model, &row));
    }
    gtk_list_store_clear (store);
}

- (cairo_surface_t*) createEdgeIconSurface {
    return cairo_image_surface_create (CAIRO_FORMAT_ARGB32, 48, 18);
}

- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style {
    cairo_surface_t *surface = [self createEdgeIconSurface];
    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
    return pixbuf;
}

- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface {
    Transformer *transformer = [Transformer defaultTransformer];
    [transformer setFlippedAboutXAxis:YES];

    int width = cairo_image_surface_get_width (surface);
    int height = cairo_image_surface_get_height (surface);
    NSRect pixbufBounds = NSMakeRect(0.0, 0.0, width, height);
    NSRect graphBounds = [transformer rectFromScreen:pixbufBounds];

    NSPoint start = NSMakePoint (NSMinX (graphBounds) + 0.1f, NSMidY (graphBounds));
    NSPoint end = NSMakePoint (NSMaxX (graphBounds) - 0.1f, NSMidY (graphBounds));
    Node *src = [Node nodeWithPoint:start];
    Node *tgt = [Node nodeWithPoint:end];
    Edge *e = [Edge edgeWithSource:src andTarget:tgt];
    [e setStyle:style];

    CairoRenderContext *context = [[CairoRenderContext alloc] initForSurface:surface];
    [context clearSurface];
    [e renderBasicEdgeInContext:context withTransformer:transformer selected:NO];
    [context release];

    return pixbuf_get_from_surface (surface);
}

- (void) addStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface {
    GtkTreeIter iter;
    gtk_list_store_append (store, &iter);

    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style usingSurface:surface];
    gtk_list_store_set (store, &iter,
            STYLES_NAME_COL, [[style name] UTF8String],
            STYLES_ICON_COL, pixbuf,
            STYLES_PTR_COL, (gpointer)[style retain],
            -1);
    g_object_unref (pixbuf);
    [self observeStyle:style];
}

- (void) addStyle:(EdgeStyle*)style {
    cairo_surface_t *surface = [self createEdgeIconSurface];
    [self addStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
}

- (void) observeStyle:(EdgeStyle*)style {
    [style addObserver:self
            forKeyPath:@"name"
               options:NSKeyValueObservingOptionNew
               context:NULL];
    [style addObserver:self
            forKeyPath:@"thickness"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"headStyle"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"tailStyle"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"decorationStyle"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"colorRGB.red"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"colorRGB.green"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"colorRGB.blue"
               options:0
               context:NULL];
}

- (void) stopObservingStyle:(EdgeStyle*)style {
    [style removeObserver:self forKeyPath:@"name"];
    [style removeObserver:self forKeyPath:@"thickness"];
    [style removeObserver:self forKeyPath:@"headStyle"];
    [style removeObserver:self forKeyPath:@"tailStyle"];
    [style removeObserver:self forKeyPath:@"decorationStyle"];
    [style removeObserver:self forKeyPath:@"colorRGB.red"];
    [style removeObserver:self forKeyPath:@"colorRGB.green"];
    [style removeObserver:self forKeyPath:@"colorRGB.blue"];
}

- (void) reloadStyles {
    [self clearModel];
    cairo_surface_t *surface = [self createEdgeIconSurface];
    for (EdgeStyle *style in [styleManager edgeStyles]) {
        [self addStyle:style usingSurface:surface];
    }
    cairo_surface_destroy (surface);
}
@end

// }}}
// {{{ GTK+ callbacks

static void selection_changed_cb (GtkTreeSelection *sel, EdgeStyleSelector *mgr) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [mgr selectionChanged];
    [pool drain];
}
// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker

