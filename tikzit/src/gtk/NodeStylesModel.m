/*
 * Copyright 2011-2012  Alex Merry <dev@randomguy3.me.uk>
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

#import "NodeStylesModel.h"

#import "CairoRenderContext.h"
#import "NodeStyle.h"
#import "Shape.h"
#import "Shape+Render.h"
#import "ShapeNames.h"
#import "StyleManager.h"

#import "gtkhelpers.h"

#import <gdk-pixbuf/gdk-pixbuf.h>

// {{{ Internal interfaces

@interface NodeStylesModel (Notifications)
- (void) nodeStylesReplaced:(NSNotification*)notification;
- (void) nodeStyleAdded:(NSNotification*)notification;
- (void) nodeStyleRemoved:(NSNotification*)notification;
- (void) shapeDictionaryReplaced:(NSNotification*)n;
- (void) observeValueForKeyPath:(NSString*)keyPath
                       ofObject:(id)object
                         change:(NSDictionary*)change
                        context:(void*)context;
@end

@interface NodeStylesModel (Private)
- (cairo_surface_t*) createNodeIconSurface;
- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style;
- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) addNodeStyle:(NodeStyle*)style;
- (void) addNodeStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface;
- (void) observeNodeStyle:(NodeStyle*)style;
- (void) stopObservingNodeStyle:(NodeStyle*)style;
- (void) clearNodeStylesModel;
- (void) reloadNodeStyles;
@end

// }}}
// {{{ API

@implementation NodeStylesModel

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
        store = gtk_list_store_new (NODE_STYLES_N_COLS,
                                    G_TYPE_STRING,
                                    GDK_TYPE_PIXBUF,
                                    G_TYPE_POINTER);
        g_object_ref_sink (store);

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

    [self clearNodeStylesModel];
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
                                             selector:@selector(nodeStylesReplaced:)
                                                 name:@"NodeStylesReplaced"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(nodeStyleAdded:)
                                                 name:@"NodeStyleAdded"
                                               object:m];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(nodeStyleRemoved:)
                                                 name:@"NodeStyleRemoved"
                                               object:m];

    [styleManager release];
    styleManager = m;

    [self reloadNodeStyles];
}

- (GtkTreeModel*) model {
    return GTK_TREE_MODEL (store);
}

- (NodeStyle*) styleFromPath:(GtkTreePath*)path {
    GtkTreeIter iter;
    gtk_tree_model_get_iter (GTK_TREE_MODEL (store), &iter, path);
    NodeStyle *style = nil;
    gtk_tree_model_get (GTK_TREE_MODEL (store), &iter, NODE_STYLES_PTR_COL, &style, -1);
    return style;
}

- (GtkTreePath*) pathFromStyle:(NodeStyle*)style {
    GtkTreeModel *m = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (m, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (m, &row, NODE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                return gtk_tree_model_get_path (m, &row);
            }
        } while (gtk_tree_model_iter_next (m, &row));
    }
    return NULL;
}
@end

// }}}
// {{{ Notifications

@implementation NodeStylesModel (Notifications)

- (void) nodeStylesReplaced:(NSNotification*)notification {
    [self reloadNodeStyles];
}

- (void) nodeStyleAdded:(NSNotification*)notification {
    [self addNodeStyle:[[notification userInfo] objectForKey:@"style"]];
}

- (void) nodeStyleRemoved:(NSNotification*)notification {
    NodeStyle *style = [[notification userInfo] objectForKey:@"style"];

    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (model, &row, NODE_STYLES_PTR_COL, &rowStyle, -1);
            if (style == rowStyle) {
                gtk_list_store_remove (store, &row);
                [self stopObservingNodeStyle:rowStyle];
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
    if ([object class] == [NodeStyle class]) {
        NodeStyle *style = object;

        GtkTreeModel *model = GTK_TREE_MODEL (store);
        GtkTreeIter row;
        if (gtk_tree_model_get_iter_first (model, &row)) {
            do {
                NodeStyle *rowStyle;
                gtk_tree_model_get (model, &row, NODE_STYLES_PTR_COL, &rowStyle, -1);
                if (style == rowStyle) {
                    if ([@"name" isEqual:keyPath]) {
                        gtk_list_store_set (store, &row, NODE_STYLES_NAME_COL, [[style name] UTF8String], -1);
                    } else {
                        GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style];
                        gtk_list_store_set (store, &row, NODE_STYLES_ICON_COL, pixbuf, -1);
                        g_object_unref (pixbuf);
                    }
                }
            } while (gtk_tree_model_iter_next (model, &row));
        }
    }
}

- (void) shapeDictionaryReplaced:(NSNotification*)n {
    [self reloadNodeStyles];
}
@end

// }}}
// {{{ Private

@implementation NodeStylesModel (Private)
- (cairo_surface_t*) createNodeIconSurface {
    return cairo_image_surface_create (CAIRO_FORMAT_ARGB32, 24, 24);
}

- (GdkPixbuf*) pixbufOfNodeInStyle:(NodeStyle*)style {
    cairo_surface_t *surface = [self createNodeIconSurface];
    GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
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

    return pixbuf_get_from_surface (surface);
}

- (void) addNodeStyle:(NodeStyle*)style usingSurface:(cairo_surface_t*)surface {
    GtkTreeIter iter;
    gtk_list_store_append (store, &iter);

    GdkPixbuf *pixbuf = [self pixbufOfNodeInStyle:style usingSurface:surface];
    gtk_list_store_set (store, &iter,
            NODE_STYLES_NAME_COL, [[style name] UTF8String],
            NODE_STYLES_ICON_COL, pixbuf,
            NODE_STYLES_PTR_COL, (gpointer)[style retain],
            -1);
    g_object_unref (pixbuf);
    [self observeNodeStyle:style];
}

- (void) addNodeStyle:(NodeStyle*)style {
    cairo_surface_t *surface = [self createNodeIconSurface];
    [self addNodeStyle:style usingSurface:surface];
    cairo_surface_destroy (surface);
}

- (void) observeNodeStyle:(NodeStyle*)style {
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

- (void) stopObservingNodeStyle:(NodeStyle*)style {
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

- (void) clearNodeStylesModel {
    GtkTreeModel *model = GTK_TREE_MODEL (store);
    GtkTreeIter row;
    if (gtk_tree_model_get_iter_first (model, &row)) {
        do {
            NodeStyle *rowStyle;
            gtk_tree_model_get (model, &row, NODE_STYLES_PTR_COL, &rowStyle, -1);
            [self stopObservingNodeStyle:rowStyle];
            [rowStyle release];
        } while (gtk_tree_model_iter_next (model, &row));
    }
    gtk_list_store_clear (store);
}

- (void) reloadNodeStyles {
    [self clearNodeStylesModel];
    cairo_surface_t *surface = [self createNodeIconSurface];
    for (NodeStyle *style in [styleManager nodeStyles]) {
        [self addNodeStyle:style usingSurface:surface];
    }
    cairo_surface_destroy (surface);
}
@end

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
