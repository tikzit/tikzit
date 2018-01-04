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

#import "EdgeStylesModel.h"

// {{{ Internal interfaces
static void selection_changed_cb (GtkTreeSelection *sel, EdgeStyleSelector *mgr);
// }}}
// {{{ API

@implementation EdgeStyleSelector

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)m {
    return [self initWithModel:[EdgeStylesModel modelWithStyleManager:m]];
}
- (id) initWithModel:(EdgeStylesModel*)m {
    self = [super init];

    if (self) {
        model = [m retain];

        view = GTK_TREE_VIEW (gtk_tree_view_new_with_model ([m model]));
        gtk_tree_view_set_headers_visible (view, FALSE);
        g_object_ref (view);

        GtkCellRenderer *renderer;
        GtkTreeViewColumn *column;
        renderer = gtk_cell_renderer_pixbuf_new ();
        column = gtk_tree_view_column_new_with_attributes (
                "Preview",
                renderer,
                "pixbuf", EDGE_STYLES_ICON_COL,
                NULL);
        gtk_tree_view_append_column (view, column);
        gtk_tree_view_set_tooltip_column (view, EDGE_STYLES_NAME_COL);

        GtkTreeSelection *sel = gtk_tree_view_get_selection (view);
        gtk_tree_selection_set_mode (sel, GTK_SELECTION_SINGLE);

        g_signal_connect (G_OBJECT (sel),
                          "changed",
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

- (EdgeStylesModel*) model {
    return model;
}

- (void) setModel:(EdgeStylesModel*)m {
    if (m == model)
        return;

    EdgeStylesModel *oldModel = model;
    model = [m retain];
    gtk_tree_view_set_model (view, [model model]);
    [oldModel release];
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
    gtk_tree_model_get ([model model], &iter, EDGE_STYLES_PTR_COL, &style, -1);

    return style;
}

- (void) setSelectedStyle:(EdgeStyle*)style {
    GtkTreeSelection *sel = gtk_tree_view_get_selection (view);

    if (style == nil) {
        gtk_tree_selection_unselect_all (sel);
        return;
    }

    GtkTreePath *path = [model pathFromStyle:style];
    if (path) {
        gtk_tree_selection_unselect_all (sel);
        gtk_tree_selection_select_path (sel, path);
        gtk_tree_path_free (path);
    }
}
@end

// }}}
// {{{ GTK+ callbacks

static void selection_changed_cb (GtkTreeSelection *sel, EdgeStyleSelector *mgr) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    [[NSNotificationCenter defaultCenter]
        postNotificationName:@"SelectedStyleChanged"
                      object:mgr];

    [pool drain];
}
// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker

