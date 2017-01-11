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

#import "NodeStyleSelector.h"

#import "NodeStylesModel.h"

// {{{ Internal interfaces
static void selection_changed_cb (GtkIconView *widget, NodeStyleSelector *mgr);
// }}}
// {{{ API

@implementation NodeStyleSelector

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)m {
    return [self initWithModel:[NodeStylesModel modelWithStyleManager:m]];
}
- (id) initWithModel:(NodeStylesModel*)m {
    self = [super init];

    if (self) {
        model = [m retain];

        view = GTK_ICON_VIEW (gtk_icon_view_new ());
        g_object_ref_sink (view);

        gtk_icon_view_set_model (view, [model model]);
        gtk_icon_view_set_pixbuf_column (view, NODE_STYLES_ICON_COL);
        gtk_icon_view_set_tooltip_column (view, NODE_STYLES_NAME_COL);
        gtk_icon_view_set_selection_mode (view, GTK_SELECTION_SINGLE);

        g_signal_connect (G_OBJECT (view),
                          "selection-changed",
                          G_CALLBACK (selection_changed_cb),
                          self);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (view);
    [model release];

    [super dealloc];
}

- (NodeStylesModel*) model {
    return model;
}

- (void) setModel:(NodeStylesModel*)m {
    if (m == model)
        return;

    NodeStylesModel *oldModel = model;
    model = [m retain];
    gtk_icon_view_set_model (view, [model model]);
    [oldModel release];
}

- (GtkWidget*) widget {
    return GTK_WIDGET (view);
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
    NodeStyle *style = [model styleFromPath:path];

    g_list_foreach (list, (GFunc)gtk_tree_path_free, NULL);
    g_list_free (list);

    return style;
}

- (void) setSelectedStyle:(NodeStyle*)style {
    if (style == nil) {
        gtk_icon_view_unselect_all (view);
        return;
    }

    GtkTreePath *path = [model pathFromStyle:style];
    if (path) {
        gtk_icon_view_unselect_all (view);
        gtk_icon_view_select_path (view, path);
        gtk_tree_path_free (path);
    }
}

@end

// }}}
// {{{ GTK+ callbacks

static void selection_changed_cb (GtkIconView *view, NodeStyleSelector *mgr) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    [[NSNotificationCenter defaultCenter]
        postNotificationName:@"SelectedStyleChanged"
                      object:mgr];

    [pool drain];
}
// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
