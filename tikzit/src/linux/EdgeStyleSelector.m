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
#import "Shape.h"
#import "Shape+Render.h"
#import "ShapeNames.h"
#import "StyleManager.h"

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
- (void) activeStyleChanged:(NSNotification*)notification;
- (void) stylePropertyChanged:(NSNotification*)notification;
- (void) shapeDictionaryReplaced:(NSNotification*)n;
- (void) selectionChanged;
@end

@interface EdgeStyleSelector (Private)
- (void) clearModel;
- (cairo_surface_t*) createEdgeIconSurface;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style;
- (GdkPixbuf*) pixbufFromSurface:(cairo_surface_t*)surface;
- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) addStyle:(EdgeStyle*)style;
- (void) postSelectedStyleChanged;
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
        linkedToActiveStyle = YES;

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
                                                 selector:@selector(stylePropertyChanged:)
                                                     name:@"EdgeStylePropertyChanged"
                                                   object:nil];
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
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(activeStyleChanged:)
                                                 name:@"ActiveEdgeStyleChanged"
                                               object:m];

    [styleManager release];
    styleManager = m;

    [self reloadStyles];
}

- (GtkWidget*) widget {
    return GTK_WIDGET (view);
}

- (BOOL) isLinkedToActiveStyle {
    return linkedToActiveStyle;
}

- (void) setLinkedToActiveStyle:(BOOL)linked {
    linkedToActiveStyle = linked;
    if (linkedToActiveStyle) {
        EdgeStyle *style = [self selectedStyle];
        if ([styleManager activeEdgeStyle] != style) {
            [self setSelectedStyle:[styleManager activeEdgeStyle]];
        }
    }
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
                [rowStyle release];
                return;
            }
        } while (gtk_tree_model_iter_next (model, &row));
    }
}

- (void) activeStyleChanged:(NSNotification*)notification {
    if (linkedToActiveStyle) {
        EdgeStyle *style = [self selectedStyle];
        if ([styleManager activeEdgeStyle] != style) {
            [self setSelectedStyle:[styleManager activeEdgeStyle]];
        }
    }
}

- (void) stylePropertyChanged:(NSNotification*)notification {
    EdgeStyle *style = [notification object];

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            EdgeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                if ([@"name" isEqual:[[notification userInfo] objectForKey:@"propertyName"]]) {
                    gtk_list_store_set (store, &row, STYLES_NAME_COL, [[style name] UTF8String], -1);
                } else if (![@"scale" isEqual:[[notification userInfo] objectForKey:@"propertyName"]]) {
                    GdkPixbuf *pixbuf = [self pixbufOfEdgeInStyle:style];
                    gtk_list_store_set (store, &row, STYLES_ICON_COL, pixbuf, -1);
                    gdk_pixbuf_unref (pixbuf);
                }
            }
        } while (gtk_tree_model_iter_next (model, &row));
    }
}

- (void) shapeDictionaryReplaced:(NSNotification*)n {
    [self reloadStyles];
}

- (void) selectionChanged {
    if (linkedToActiveStyle) {
        EdgeStyle *style = [self selectedStyle];
        if ([styleManager activeEdgeStyle] != style) {
            [styleManager setActiveEdgeStyle:style];
        }
    }
    [self postSelectedStyleChanged];
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

// Bring on GTK+3 and gdk_pixbuf_get_from_surface()
- (GdkPixbuf*) pixbufFromSurface:(cairo_surface_t*)surface {
    cairo_surface_flush (surface);

    int width = cairo_image_surface_get_width (surface);
    int height = cairo_image_surface_get_height (surface);
    int stride = cairo_image_surface_get_stride (surface);
    unsigned char *data = cairo_image_surface_get_data (surface);

    GdkPixbuf *pixbuf = gdk_pixbuf_new (GDK_COLORSPACE_RGB,
                                        TRUE,
                                        8,
                                        width,
                                        height);
    unsigned char *pbdata = gdk_pixbuf_get_pixels (pixbuf);
    int pbstride = gdk_pixbuf_get_rowstride (pixbuf);

    for (int y = 0; y < height; ++y) {
        uint32_t *line = (uint32_t*)(data + y*stride);
        unsigned char *pbline = pbdata + (y*pbstride);
        for (int x = 0; x < width; ++x) {
            uint32_t pixel = *(line + x);
            unsigned char *pbpixel = pbline + (x*4);
            // NB: We should un-pre-mult the alpha here.
            //     However, in our world, alpha is always
            //     on or off, so it doesn't really matter
            pbpixel[3] = ((pixel & 0xff000000) >> 24);
            pbpixel[0] = ((pixel & 0x00ff0000) >> 16);
            pbpixel[1] = ((pixel & 0x0000ff00) >> 8);
            pbpixel[2] =  (pixel & 0x000000ff);
        }
    }

    return pixbuf;
}

- (GdkPixbuf*) pixbufOfEdgeInStyle:(EdgeStyle*)style usingSurface:(cairo_surface_t*)surface {
    Transformer *transformer = [Transformer defaultTransformer];
    [transformer setFlippedAboutXAxis:YES];

    int width = cairo_image_surface_get_width (surface);
    int height = cairo_image_surface_get_height (surface);
    NSRect pixbufBounds = NSMakeRect(0.0, 0.0, width, height);
    NSRect graphBounds = [transformer rectFromScreen:pixbufBounds];

    NSPoint mid = NSMakePoint (NSMidX (graphBounds), NSMidY (graphBounds));
    NSPoint start = NSMakePoint (NSMinX (graphBounds) + 0.1f, mid.y);
    NSPoint end = NSMakePoint (NSMaxX (graphBounds) - 0.1f, mid.y);
    NSPoint midTan = NSMakePoint (mid.x + 0.1f, mid.y);
    NSPoint leftNormal = NSMakePoint (mid.x, mid.y - 0.1f);
    NSPoint rightNormal = NSMakePoint (mid.x, mid.y + 0.1f);

    CairoRenderContext *context = [[CairoRenderContext alloc] initForSurface:surface];
    [context clearSurface];

    [context startPath];
    [context moveTo:[transformer toScreen:start]];
    [context lineTo:[transformer toScreen:end]];

    switch ([style decorationStyle]) {
        case ED_None:
            break;
        case ED_Tick:
            [context moveTo:[transformer toScreen:leftNormal]];
            [context lineTo:[transformer toScreen:rightNormal]];
            break;
        case ED_Arrow:
            [context moveTo:[transformer toScreen:leftNormal]];
            [context lineTo:[transformer toScreen:midTan]];
            [context lineTo:[transformer toScreen:rightNormal]];
            break;
    }

    [context setLineWidth:[style thickness]];
    [context strokePathWithColor:BlackRColor];

    [context release];

    return [self pixbufFromSurface:surface];
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
    gdk_pixbuf_unref (pixbuf);
}

- (void) addStyle:(EdgeStyle*)style {
    cairo_surface_t *surface = [self createEdgeIconSurface];
    [self addStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
}

- (void) postSelectedStyleChanged {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"SelectedStyleChanged" object:self];
}

- (void) reloadStyles {
    [self clearModel];
    for (EdgeStyle *style in [styleManager edgeStyles]) {
        [self addStyle:style];
    }
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

