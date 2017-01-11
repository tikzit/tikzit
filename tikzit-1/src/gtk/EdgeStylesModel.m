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

#import "EdgeStylesModel.h"

#import "CairoRenderContext.h"
#import "Edge.h"
#import "Edge+Render.h"
#import "EdgeStyle.h"
#import "Node.h"
#import "StyleManager.h"

#import "gtkhelpers.h"

#import <gdk-pixbuf/gdk-pixbuf.h>

// {{{ Internal interfaces

@interface EdgeStylesModel (Notifications)
- (void) edgeStylesReplaced:(NSNotification*)notification;
- (void) edgeStyleAdded:(NSNotification*)notification;
- (void) edgeStyleRemoved:(NSNotification*)notification;
- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context;
@end

@interface EdgeStylesModel (Private)
- (cairo_surface_t*) createEdgeIconSurface;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) addEdgeStyle:(EdgeStyle*)style;
- (void) addEdgeStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) observeEdgeStyle:(EdgeStyle*)style;
- (void) stopObservingEdgeStyle:(EdgeStyle*)style;
- (void) clearEdgeStylesModel;
- (void) reloadEdgeStyles;
@end

// }}}
// {{{ API

@implementation EdgeStylesModel

+ (id) modelWithStyleManager:(StyleManager*)m {
    return [[[self alloc] initWithStyleManager:m] autorelease];
}

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)m {
    self = [super init];

    if (self) {
        store = gtk_list_store_new (EDGE_STYLES_N_COLS,
                                    G_TYPE_STRING,
                                    GDK_TYPE_PIXBUF,
                                    G_TYPE_POINTER);
        g_object_ref_sink (store);

        [self setStyleManager:m];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [self clearEdgeStylesModel];
    g_object_unref (store);
    [styleManager release];

    [super dealloc];
}

- (GtkTreeModel*) model {
    return GTK_TREE_MODEL (store);
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
                                             selector:@selector(edgeStylesReplaced:)
                                                 name:@"EdgeStylesReplaced"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(edgeStyleAdded:)
                                                 name:@"EdgeStyleAdded"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(edgeStyleRemoved:)
                                                 name:@"EdgeStyleRemoved"
                                               object:m];

    [styleManager release];
    styleManager = m;

    [self reloadEdgeStyles];
}

- (EdgeStyle*) styleFromPath:(GtkTreePath*)path {
    GtkTreeIter iter;
    gtk_tree_model_get_iter (GTK_TREE_MODEL (store), &iter, path);
    EdgeStyle *style = nil;
    gtk_tree_model_get (GTK_TREE_MODEL (store), &iter, EDGE_STYLES_PTR_COL, &style, -1);
    return style;
}

- (GtkTreePath*) pathFromStyle:(EdgeStyle*)style {
    GtkTreeModel *m = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (m, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (m, &row, EDGE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                return gtk_tree_model_get_path (m, &row);
            }
        } while (gtk_tree_model_iter_next (m, &row));
    }
    return NULL;
}

- (EdgeStyle*) styleFromIter:(GtkTreeIter*)iter {
    EdgeStyle *style = nil;
    gtk_tree_model_get (GTK_TREE_MODEL (store), iter, EDGE_STYLES_PTR_COL, &style, -1);
    return style;
}

- (GtkTreeIter*) iterFromStyle:(EdgeStyle*)style {
    GtkTreeModel *m = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (m, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (m, &row, EDGE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                return gtk_tree_iter_copy (&row);
            }
        } while (gtk_tree_model_iter_next (m, &row));
    }
    return NULL;
}
@end

// }}}
// {{{ Notifications

@implementation EdgeStylesModel (Notifications)

- (void) edgeStylesReplaced:(NSNotification*)notification {
    [self reloadEdgeStyles];
}

- (void) edgeStyleAdded:(NSNotification*)notification {
    [self addEdgeStyle:[[notification userInfo] objectForKey:@"style"]];
}

- (void) edgeStyleRemoved:(NSNotification*)notification {
    EdgeStyle *style = [[notification userInfo] objectForKey:@"style"];

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, EDGE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                gtk_list_store_remove (store, &row);
                [self stopObservingEdgeStyle:rowStyle];
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
            gtk_tree_model_get (model, &row, EDGE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                if ([@"name" isEqual:keyPath]) {
                    gtk_list_store_set (store, &row, EDGE_STYLES_NAME_COL, [[style name] UTF8String], -1);
                } else {
                    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style];
                    gtk_list_store_set (store, &row, EDGE_STYLES_ICON_COL, pixbuf, -1);
                    g_object_unref (pixbuf);
                }
            }
        } while (gtk_tree_model_iter_next (model, &row));
    }
}
@end

// }}}
// {{{ Private

@implementation EdgeStylesModel (Private)
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

- (void) addEdgeStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface {
    GtkTreeIter iter;
    gtk_list_store_append (store, &iter);

    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style usingSurface:surface];
    gtk_list_store_set (store, &iter,
            EDGE_STYLES_NAME_COL, [[style name] UTF8String],
            EDGE_STYLES_ICON_COL, pixbuf,
            EDGE_STYLES_PTR_COL, (gpointer)[style retain],
            -1);
    g_object_unref (pixbuf);
    [self observeEdgeStyle:style];
}

- (void) addEdgeStyle:(EdgeStyle*)style {
    cairo_surface_t *surface = [self createEdgeIconSurface];
    [self addEdgeStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
}

- (void) observeEdgeStyle:(EdgeStyle*)style {
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

- (void) stopObservingEdgeStyle:(EdgeStyle*)style {
    [style removeObserver:self forKeyPath:@"name"];
    [style removeObserver:self forKeyPath:@"thickness"];
    [style removeObserver:self forKeyPath:@"headStyle"];
    [style removeObserver:self forKeyPath:@"tailStyle"];
    [style removeObserver:self forKeyPath:@"decorationStyle"];
    [style removeObserver:self forKeyPath:@"colorRGB.red"];
    [style removeObserver:self forKeyPath:@"colorRGB.green"];
    [style removeObserver:self forKeyPath:@"colorRGB.blue"];
}

- (void) clearEdgeStylesModel {
    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, EDGE_STYLES_PTR_COL, &rowStyle, -1);
            [self stopObservingEdgeStyle:rowStyle];
            [rowStyle release];
        } while (gtk_tree_model_iter_next (model, &row));
    }
    gtk_list_store_clear (store);
}

- (void) reloadEdgeStyles {
    [self clearEdgeStylesModel];
    cairo_surface_t *surface = [self createEdgeIconSurface];
    for (EdgeStyle *style in [styleManager edgeStyles]) {
        [self addEdgeStyle:style usingSurface:surface];
    }
    cairo_surface_destroy (surface);
}
@end

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
