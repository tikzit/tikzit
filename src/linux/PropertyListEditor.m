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

#import "PropertyListEditor.h"

// {{{ Constants

enum {
    PLM_NAME_COL = 0,
    PLM_VALUE_COL,
    PLM_IS_PROPERTY_COL,
    PLM_PROPERTY_COL,
    PLM_N_COLS
};

// }}}
// {{{ Internal interfaces
// {{{ Signals

static void value_edited_cb (GtkCellRendererText *renderer,
                             gchar               *path,
                             gchar               *new_text,
                             PropertyListEditor  *editor);
static void name_edited_cb (GtkCellRendererText *renderer,
                            gchar               *path,
                            gchar               *new_text,
                            PropertyListEditor  *editor);
static void add_prop_clicked_cb (GtkButton *button,
                                 PropertyListEditor  *editor);
static void add_atom_clicked_cb (GtkButton *button,
                                 PropertyListEditor  *editor);
static void remove_clicked_cb (GtkButton *button,
                               PropertyListEditor  *editor);

// }}}
// {{{ Private

@interface PropertyListEditor (Private)
- (void) updatePath:(gchar*)path withValue:(NSString*)newText;
- (void) updatePath:(gchar*)path withName:(NSString*)newText;
- (void) addProperty;
- (void) addAtom;
- (void) removeSelected;
@end

// }}}
// }}}
// {{{ API

@implementation PropertyListEditor

- (id) init {
    self = [super init];

    if (self) {
        list = gtk_list_store_new (PLM_N_COLS,
                                   G_TYPE_STRING,
                                   G_TYPE_STRING,
                                   G_TYPE_BOOLEAN,
                                   G_TYPE_POINTER);
        view = gtk_tree_view_new_with_model (GTK_TREE_MODEL (list));
        GtkWidget *scrolledview = gtk_scrolled_window_new (NULL, NULL);
        gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (scrolledview),
                GTK_POLICY_AUTOMATIC,
                GTK_POLICY_AUTOMATIC);
        gtk_container_add (GTK_CONTAINER (scrolledview), view);
        gtk_widget_set_size_request (view, -1, 150);
        data = nil;
        delegate = nil;

        GtkCellRenderer *renderer;
        GtkTreeViewColumn *column;

        renderer = gtk_cell_renderer_text_new ();
        g_object_set (G_OBJECT (renderer),
                      "editable", TRUE,
                      NULL);
        column = gtk_tree_view_column_new_with_attributes ("Key/Atom",
                                                           renderer,
                                                           "text", PLM_NAME_COL,
                                                           NULL);
        gtk_tree_view_append_column (GTK_TREE_VIEW (view), column);
        g_signal_connect (G_OBJECT (renderer),
            "edited",
            G_CALLBACK (name_edited_cb),
            self);

        renderer = gtk_cell_renderer_text_new ();
        column = gtk_tree_view_column_new_with_attributes ("Value",
                                                           renderer,
                                                           "text", PLM_VALUE_COL,
                                                           "editable", PLM_IS_PROPERTY_COL,
                                                           "sensitive", PLM_IS_PROPERTY_COL,
                                                           NULL);
        gtk_tree_view_append_column (GTK_TREE_VIEW (view), column);
        g_signal_connect (G_OBJECT (renderer),
            "edited",
            G_CALLBACK (value_edited_cb),
            self);

        widget = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (G_OBJECT (widget));
        gtk_container_add (GTK_CONTAINER (widget), scrolledview);

        GtkBox *buttonBox = GTK_BOX (gtk_hbox_new(FALSE, 0));
        gtk_box_pack_start (GTK_BOX (widget), GTK_WIDGET (buttonBox), FALSE, FALSE, 0);

        GtkWidget *addPropButton = gtk_button_new ();
        //gtk_widget_set_size_request (addPropButton, 27, 27);
        gtk_widget_set_tooltip_text (addPropButton, "Add property");
        GtkWidget *addPropContents = gtk_hbox_new(FALSE, 0);
        GtkWidget *addPropIcon = gtk_image_new_from_stock (GTK_STOCK_ADD, GTK_ICON_SIZE_BUTTON);
        gtk_container_add (GTK_CONTAINER (addPropContents), addPropIcon);
        gtk_container_add (GTK_CONTAINER (addPropContents), gtk_label_new ("P"));
        gtk_container_add (GTK_CONTAINER (addPropButton), addPropContents);
        gtk_box_pack_start (buttonBox, addPropButton, FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (addPropButton),
            "clicked",
            G_CALLBACK (add_prop_clicked_cb),
            self);

        GtkWidget *addAtomButton = gtk_button_new ();
        //gtk_widget_set_size_request (addAtomButton, 27, 27);
        gtk_widget_set_tooltip_text (addAtomButton, "Add atom");
        GtkWidget *addAtomContents = gtk_hbox_new(FALSE, 0);
        GtkWidget *addAtomIcon = gtk_image_new_from_stock (GTK_STOCK_ADD, GTK_ICON_SIZE_BUTTON);
        gtk_container_add (GTK_CONTAINER (addAtomContents), addAtomIcon);
        gtk_container_add (GTK_CONTAINER (addAtomContents), gtk_label_new ("A"));
        gtk_container_add (GTK_CONTAINER (addAtomButton), addAtomContents);
        gtk_box_pack_start (buttonBox, addAtomButton, FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (addAtomButton),
            "clicked",
            G_CALLBACK (add_atom_clicked_cb),
            self);

        GtkWidget *removeButton = gtk_button_new ();
        //gtk_widget_set_size_request (removeButton, 27, 27);
        gtk_widget_set_tooltip_text (removeButton, "Remove selected");
        GtkWidget *removeIcon = gtk_image_new_from_stock (GTK_STOCK_REMOVE, GTK_ICON_SIZE_BUTTON);
        gtk_container_add (GTK_CONTAINER (removeButton), removeIcon);
        gtk_box_pack_start (buttonBox, removeButton, FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (removeButton),
            "clicked",
            G_CALLBACK (remove_clicked_cb),
            self);

        gtk_widget_show_all (GTK_WIDGET (buttonBox));
        gtk_widget_show_all (scrolledview);
    }

    return self;
}

- (void) clearStore {
    GtkTreeIter iter;
    if (gtk_tree_model_get_iter_first (GTK_TREE_MODEL (list), &iter)) {
        do {
            void *prop;
            gtk_tree_model_get (GTK_TREE_MODEL (list), &iter,
                PLM_PROPERTY_COL, &prop,
                -1);
            [(id)prop release];
        } while (gtk_tree_model_iter_next (GTK_TREE_MODEL (list), &iter));
        gtk_list_store_clear (list);
    }
}

- (void) reloadProperties {
    [self clearStore];
    int pos = 0;
    for (GraphElementProperty *p in data) {
        GtkTreeIter iter;
        [p retain];
        gtk_list_store_insert_with_values (list, &iter, pos,
                PLM_NAME_COL, [[p key] UTF8String],
                PLM_VALUE_COL, [[p value] UTF8String],
                PLM_IS_PROPERTY_COL, ![p isAtom],
                PLM_PROPERTY_COL, (void *)p,
                -1);
        ++pos;
    }
}

- (GtkWidget*) widget { return widget; }
- (GraphElementData*) data { return data; }
- (void) setData:(GraphElementData*)d {
    [d retain];
    [data release];
    data = d;
    [self reloadProperties];
}

- (NSObject<PropertyChangeDelegate>*) delegate {
    return delegate;
}

- (void) setDelegate:(NSObject<PropertyChangeDelegate>*)d {
    id oldDelegate = delegate;
    delegate = [d retain];
    [oldDelegate release];
}

- (void) dealloc {
    [self clearStore];
    [data release];
    g_object_unref (list);
    g_object_unref (widget);
    [super dealloc];
}

@end

// }}}
// {{{ Private

@implementation PropertyListEditor (Private)
- (void) updatePath:(gchar*)pathStr withValue:(NSString*)newText {
    GtkTreeIter iter;
    GtkTreePath *path = gtk_tree_path_new_from_string (pathStr);

    if (!gtk_tree_model_get_iter (GTK_TREE_MODEL (list), &iter, path)) {
        gtk_tree_path_free (path);
        return;
    }

    void *propPtr;
    gtk_tree_model_get (GTK_TREE_MODEL (list), &iter,
        PLM_PROPERTY_COL, &propPtr,
        -1);
    GraphElementProperty *prop = (GraphElementProperty*)propPtr;

    if (![prop isAtom]) {
        if (![delegate respondsToSelector:@selector(startEdit)] || [delegate startEdit]) {
            [prop setValue:newText];
            gtk_list_store_set (list, &iter,
                PLM_VALUE_COL, [newText UTF8String],
                -1);
            [delegate endEdit];
        }
    }

    gtk_tree_path_free (path);
}

- (void) updatePath:(gchar*)pathStr withName:(NSString*)newText {
    GtkTreeIter iter;
    GtkTreePath *path = gtk_tree_path_new_from_string (pathStr);

    if (!gtk_tree_model_get_iter (GTK_TREE_MODEL (list), &iter, path)) {
        gtk_tree_path_free (path);
        return;
    }

    void *propPtr;
    gtk_tree_model_get (GTK_TREE_MODEL (list), &iter,
        PLM_PROPERTY_COL, &propPtr,
        -1);
    GraphElementProperty *prop = (GraphElementProperty*)propPtr;

    if (![delegate respondsToSelector:@selector(startEdit)] || [delegate startEdit]) {
        if ([newText isEqualToString:@""]) {
            [data removeObjectIdenticalTo:prop];
            gtk_list_store_remove (list, &iter);
            [prop release];
        } else {
            [prop setKey:newText];
            gtk_list_store_set (list, &iter,
                PLM_NAME_COL, [newText UTF8String],
                -1);
        }
        [delegate endEdit];
    }

    gtk_tree_path_free (path);
}

- (void) addProperty {
    GtkTreeIter iter;
    GraphElementProperty *p = [[GraphElementProperty alloc] initWithPropertyValue:@"" forKey:@"new property"];
    if (![delegate respondsToSelector:@selector(startEdit)] || [delegate startEdit]) {
        [data addObject:p];
        gint pos = [data count] - 1;
        gtk_list_store_insert_with_values (list, &iter, pos,
                PLM_NAME_COL, "new property",
                PLM_VALUE_COL, "",
                PLM_IS_PROPERTY_COL, TRUE,
                PLM_PROPERTY_COL, (void *)p,
                -1);
        [delegate endEdit];
    } else {
        [p release];
    }
}

- (void) addAtom {
    GtkTreeIter iter;
    GraphElementProperty *p = [[GraphElementProperty alloc] initWithAtomName:@"new atom"];
    if (![delegate respondsToSelector:@selector(startEdit)] || [delegate startEdit]) {
        [data addObject:p];
        gint pos = [data count] - 1;
        gtk_list_store_insert_with_values (list, &iter, pos,
                PLM_NAME_COL, "new atom",
                PLM_VALUE_COL, [[p value] UTF8String],
                PLM_IS_PROPERTY_COL, FALSE,
                PLM_PROPERTY_COL, (void *)p,
                -1);
        [delegate endEdit];
    } else {
        [p release];
    }
}

- (void) removeSelected {
    GtkTreeSelection *selection = gtk_tree_view_get_selection (GTK_TREE_VIEW (view));
    GList *selPaths = gtk_tree_selection_get_selected_rows (selection, NULL);
    GList *selIters = NULL;

    // Convert to iters, as GtkListStore has persistent iters
    GList *curr = selPaths;
    while (curr != NULL) {
        GtkTreeIter iter;
        gtk_tree_model_get_iter (GTK_TREE_MODEL (list),
                                 &iter,
                                 (GtkTreePath*)curr->data);
        selIters = g_list_prepend (selIters, gtk_tree_iter_copy (&iter));
        curr = g_list_next (curr);
    }

    // remove all iters
    curr = selIters;
    while (curr != NULL) {
        GtkTreeIter *iter = (GtkTreeIter*)curr->data;
        void *propPtr;
        gtk_tree_model_get (GTK_TREE_MODEL (list), iter,
            PLM_PROPERTY_COL, &propPtr,
            -1);
        GraphElementProperty *prop = (GraphElementProperty*)propPtr;
        if (![delegate respondsToSelector:@selector(startEdit)] || [delegate startEdit]) {
            [data removeObjectIdenticalTo:prop];
            gtk_list_store_remove (list, iter);
            [prop release];
            [delegate endEdit];
        }
        curr = g_list_next (curr);
    }

    g_list_foreach (selIters, (GFunc) gtk_tree_iter_free, NULL);
    g_list_free (selIters);
    g_list_foreach (selPaths, (GFunc) gtk_tree_path_free, NULL);
    g_list_free (selPaths);
}
@end

// }}}
// {{{ GTK+ callbacks

static void value_edited_cb (GtkCellRendererText *renderer,
                             gchar               *path,
                             gchar               *new_text,
                             PropertyListEditor  *editor)
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor updatePath:path withValue:[NSString stringWithUTF8String:new_text]];
    [pool drain];
}

static void name_edited_cb (GtkCellRendererText *renderer,
                            gchar               *path,
                            gchar               *new_text,
                            PropertyListEditor  *editor)
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor updatePath:path withName:[NSString stringWithUTF8String:new_text]];
    [pool drain];
}

static void add_prop_clicked_cb (GtkButton *button,
                                 PropertyListEditor  *editor)
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor addProperty];
    [pool drain];
}

static void add_atom_clicked_cb (GtkButton *button,
                                 PropertyListEditor  *editor)
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor addAtom];
    [pool drain];
}

static void remove_clicked_cb (GtkButton *button,
                               PropertyListEditor  *editor)
{
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor removeSelected];
    [pool drain];
}

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
