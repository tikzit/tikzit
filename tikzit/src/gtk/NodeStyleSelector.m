/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
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

#import "NodeStyleSelector.h"

#import "CairoRenderContext.h"
#import "Shape.h"
#import "Shape+Render.h"
#import "ShapeNames.h"
#import "StyleManager.h"

#import <gdk-pixbuf/gdk-pixbuf.h>

// {{{ Internal interfaces
// {{{ Signals
static void selection_changed_cb (GtkIconView *widget, NodeStyleSelector *mgr);
// }}}

enum {
    STYLES_NAME_COL = 0,
    STYLES_ICON_COL,
    STYLES_PTR_COL,
    STYLES_N_COLS
};

@interface NodeStyleSelector (Notifications)
- (void) stylesReplaced:(NSNotification*)notification;
- (void) styleAdded:(NSNotification*)notification;
- (void) styleRemoved:(NSNotification*)notification;
- (void) activeStyleChanged:(NSNotification*)notification;
- (void) shapeDictionaryReplaced:(NSNotification*)n;
- (void) selectionChanged;
- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context;
@end

@interface NodeStyleSelector (Private)
- (cairo_surface_t*) createNodeIconSurface;
- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style;
- (GdkPixbuf*) pixbufFromSurface:(cairo_surface_t*)surface;
- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) addStyle:(NodeStyle*)style;
- (void) postSelectedStyleChanged;
- (void) observeStyle:(NodeStyle*)style;
- (void) stopObservingStyle:(NodeStyle*)style;
- (void) clearModel;
- (void) reloadStyles;
@end

// }}}
// {{{ API

@implementation NodeStyleSelector

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

        view = GTK_ICON_VIEW (gtk_icon_view_new ());
        g_object_ref (view);

        gtk_icon_view_set_model (view, GTK_TREE_MODEL (store));
        gtk_icon_view_set_pixbuf_column (view, STYLES_ICON_COL);
        gtk_icon_view_set_tooltip_column (view, STYLES_NAME_COL);
        gtk_icon_view_set_selection_mode (view, GTK_SELECTION_SINGLE);

        g_signal_connect (G_OBJECT (view),
                          "selection-changed",
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
                                                 name:@"NodeStylesReplaced"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(styleAdded:)
                                                 name:@"NodeStyleAdded"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(styleRemoved:)
                                                 name:@"NodeStyleRemoved"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(activeStyleChanged:)
                                                 name:@"ActiveNodeStyleChanged"
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
        NodeStyle *style = [self selectedStyle];
        if ([styleManager activeNodeStyle] != style) {
            [self setSelectedStyle:[styleManager activeNodeStyle]];
        }
    }
}

- (NodeStyle*) selectedStyle {
    GList *list = gtk_icon_view_get_selected_items (view);
    if (!list) {
        return nil;
    }
    if (list->next != NULL) {
        NSLog(@"Multiple selected items in NodeStyleSelector!");
    }

    GtkTreePath *path = (GtkTreePath*) list->data;
    GtkTreeIter iter;
    gtk_tree_model_get_iter (GTK_TREE_MODEL (store), &iter, path);
    NodeStyle *style = nil;
    gtk_tree_model_get (GTK_TREE_MODEL (store), &iter, STYLES_PTR_COL, &style, -1);

    g_list_foreach (list, (GFunc)gtk_tree_path_free, NULL);
    g_list_free (list);

    return style;
}

- (void) setSelectedStyle:(NodeStyle*)style {
    if (style == nil) {
        gtk_icon_view_unselect_all (view);
        return;
    }

    GtkTreeModel *m = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (m, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (m, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                gtk_icon_view_unselect_all (view);
                GtkTreePath *path = gtk_tree_model_get_path (m, &row);
                gtk_icon_view_select_path (view, path);
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

@implementation NodeStyleSelector (Notifications)

- (void) stylesReplaced:(NSNotification*)notification {
    [self reloadStyles];
}

- (void) styleAdded:(NSNotification*)notification {
    [self addStyle:[[notification userInfo] objectForKey:@"style"]];
}

- (void) styleRemoved:(NSNotification*)notification {
    NodeStyle *style = [[notification userInfo] objectForKey:@"style"];

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            NodeStyle *rowStyle;
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

- (void) activeStyleChanged:(NSNotification*)notification {
    if (linkedToActiveStyle) {
        NodeStyle *style = [self selectedStyle];
        if ([styleManager activeNodeStyle] != style) {
            [self setSelectedStyle:[styleManager activeNodeStyle]];
        }
    }
}

- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context
{
    if ([object class] != [NodeStyle class])
        return;

    NodeStyle *style = object;

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                if ([@"name" isEqual:keyPath]) {
                    gtk_list_store_set (store, &row, STYLES_NAME_COL, [[style name] UTF8String], -1);
                } else {
                    GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style];
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
    if (linkedToActiveStyle) {
        NodeStyle *style = [self selectedStyle];
        if ([styleManager activeNodeStyle] != style) {
            [styleManager setActiveNodeStyle:style];
        }
    }
    [self postSelectedStyleChanged];
}
@end

// }}}
// {{{ Private

@implementation NodeStyleSelector (Private)
- (cairo_surface_t*) createNodeIconSurface {
    return cairo_image_surface_create (CAIRO_FORMAT_ARGB32, 24, 24);
}

- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style {
    cairo_surface_t *surface = [self createNodeIconSurface];
    GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style usingSurface:surface];
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

- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface {
    Shape *shape = [Shape shapeForName:[style shapeName]];

    int width = cairo_image_surface_get_width (surface);
    int height = cairo_image_surface_get_height (surface);
    NSRect pixbufBounds = NSMakeRect(0.0, 0.0, width, height);
    const CGFloat lineWidth = [style strokeThickness];
    Transformer *shapeTrans = [Transformer transformerToFit:[shape boundingRect]
                                             intoScreenRect:NSInsetRect(pixbufBounds, lineWidth, lineWidth)
                                          flippedAboutXAxis:YES];
    if ([style scale] < 1.0)
        [shapeTrans setScale:[style scale] * [shapeTrans scale]];

    CairoRenderContext *context = [[CairoRenderContext alloc] initForSurface:surface];
    [context clearSurface];
    [shape drawPathWithTransform:shapeTrans andContext:context];
    [context setLineWidth:lineWidth];
    [context strokePathWithColor:[[style strokeColorRGB] rColor]
                andFillWithColor:[[style fillColorRGB] rColor]];
    [context release];

    return [self pixbufFromSurface:surface];
}

- (void) addStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface {
    GtkTreeIter iter;
    gtk_list_store_append (store, &iter);

    GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style usingSurface:surface];
    gtk_list_store_set (store, &iter,
            STYLES_NAME_COL, [[style name] UTF8String],
            STYLES_ICON_COL, pixbuf,
            STYLES_PTR_COL, (gpointer)[style retain],
            -1);
    g_object_unref (pixbuf);
    [self observeStyle:style];
}

- (void) addStyle:(NodeStyle*)style {
    cairo_surface_t *surface = [self createNodeIconSurface];
    [self addStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
}

- (void) postSelectedStyleChanged {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"SelectedStyleChanged" object:self];
}

- (void) observeStyle:(NodeStyle*)style {
    [style addObserver:self
            forKeyPath:@"name"
               options:NSKeyValueObservingOptionNew
               context:NULL];
    [style addObserver:self
            forKeyPath:@"strokeThickness"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"strokeColorRGB.red"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"strokeColorRGB.green"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"strokeColorRGB.blue"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"fillColorRGB.red"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"fillColorRGB.green"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"fillColorRGB.blue"
               options:0
               context:NULL];
    [style addObserver:self
            forKeyPath:@"shapeName"
               options:0
               context:NULL];
}

- (void) stopObservingStyle:(NodeStyle*)style {
    [style removeObserver:self forKeyPath:@"name"];
    [style removeObserver:self forKeyPath:@"strokeThickness"];
    [style removeObserver:self forKeyPath:@"strokeColorRGB.red"];
    [style removeObserver:self forKeyPath:@"strokeColorRGB.green"];
    [style removeObserver:self forKeyPath:@"strokeColorRGB.blue"];
    [style removeObserver:self forKeyPath:@"fillColorRGB.red"];
    [style removeObserver:self forKeyPath:@"fillColorRGB.green"];
    [style removeObserver:self forKeyPath:@"fillColorRGB.blue"];
    [style removeObserver:self forKeyPath:@"shapeName"];
}

- (void) clearModel {
    [self setSelectedStyle:nil];
    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (model, &row, STYLES_PTR_COL, &rowStyle, -1);
            [self stopObservingStyle:rowStyle];
            [rowStyle release];
        } while (gtk_tree_model_iter_next (model, &row));
    }
    gtk_list_store_clear (store);
}

- (void) reloadStyles {
    [self clearModel];
    cairo_surface_t *surface = [self createNodeIconSurface];
    for (NodeStyle *style in [styleManager nodeStyles]) {
        [self addStyle:style usingSurface:surface];
    }
    cairo_surface_destroy (surface);
}
@end

// }}}
// {{{ GTK+ callbacks

static void selection_changed_cb (GtkIconView *view, NodeStyleSelector *mgr) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [mgr selectionChanged];
    [pool drain];
}
// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
