//
//  gtkhelpers.h
//  TikZiT
//  
//  Copyright 2010 Alex Merry. All rights reserved.
//
//  Some code from Glade:
//    Copyright 2001 Ximian, Inc.
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  
#import "gtkhelpers.h"
#import <gdk/gdkkeysyms.h>

void gtk_table_adjust_attach (GtkTable *table,
                              GtkWidget *widget,
                              gint left_adjust,
                              gint right_adjust,
                              gint top_adjust,
                              gint bottom_adjust) {
    guint top_attach;
    guint bottom_attach;
    guint left_attach;
    guint right_attach;
    GtkAttachOptions xoptions;
    GtkAttachOptions yoptions;
    guint xpadding;
    guint ypadding;

    gtk_container_child_get (GTK_CONTAINER (table), widget,
        "top-attach", &top_attach,
        "bottom-attach", &bottom_attach,
        "left-attach", &left_attach,
        "right-attach", &right_attach,
        "x-options", &xoptions,
        "y-options", &yoptions,
        "x-padding", &xpadding,
        "y-padding", &ypadding,
        NULL);

    g_object_ref (G_OBJECT (widget));
    gtk_container_remove (GTK_CONTAINER (table), widget);
    gtk_table_attach (table, widget,
        left_attach + left_adjust,
        right_attach + right_adjust,
        top_attach + top_adjust,
        bottom_attach + bottom_adjust,
        xoptions,
        yoptions,
        xpadding,
        ypadding);
    g_object_unref (G_OBJECT (widget));
}

/*
 * Delete multiple table rows
 */
void gtk_table_delete_rows (GtkTable *table, guint firstRow, guint count) {
    if (count == 0) {
        return;
    }
    GtkContainer *tableC = GTK_CONTAINER (table);

    guint n_columns;
    guint n_rows;
    g_object_get (G_OBJECT (table),
        "n-columns", &n_columns,
        "n-rows", &n_rows,
        NULL);
    guint topBound = firstRow;
    guint bottomBound = firstRow + count;
    if (bottomBound > n_rows) {
        bottomBound = n_rows;
        count = bottomBound - topBound;
    }

    GList *toBeDeleted = NULL;
    GList *toBeShrunk = NULL;
    /* indexed by top-attach */
    GPtrArray *toBeMoved = g_ptr_array_sized_new (n_rows - topBound);
    g_ptr_array_set_size (toBeMoved, n_rows - topBound);

    GList *childIt = gtk_container_get_children (tableC);

    while (childIt) {
        GtkWidget *widget = GTK_WIDGET (childIt->data);
        guint top_attach;
        guint bottom_attach;
        gtk_container_child_get (tableC, widget,
            "top-attach", &top_attach,
            "bottom-attach", &bottom_attach,
            NULL);
        if (top_attach >= topBound && bottom_attach <= bottomBound) {
            toBeDeleted = g_list_prepend (toBeDeleted, widget);
        } else if (top_attach <= topBound && bottom_attach > topBound) {
            toBeShrunk = g_list_prepend (toBeShrunk, widget);
        } else if (top_attach > topBound) {
            GList *rowList = (GList*)g_ptr_array_index (toBeMoved, top_attach - topBound);
            rowList = g_list_prepend (rowList, widget);
            g_ptr_array_index (toBeMoved, top_attach - topBound) = rowList;
        }
        childIt = childIt->next;
    }
    g_list_free (childIt);

    /* remove anything that is completely within the segment being deleted */
    while (toBeDeleted) {
        gtk_container_remove (tableC, GTK_WIDGET (toBeDeleted->data));
        toBeDeleted = toBeDeleted->next;
    }
    g_list_free (toBeDeleted);

    /* shrink anything that spans the segment */
    while (toBeShrunk) {
        GtkWidget *widget = GTK_WIDGET (toBeShrunk->data);
        gtk_table_adjust_attach (table, widget, 0, 0, 0, -count);
        toBeShrunk = toBeShrunk->next;
    }
    g_list_free (toBeShrunk);

    /* move everything below the segment being deleted up, in order */
    /* note that "n-rows" is not a valid "top-attach" */
    for (int offset = 0; offset < (n_rows - 1) - topBound; ++offset) {
        GList *rowList = (GList *)g_ptr_array_index (toBeMoved, offset);
        guint top_attach = offset + topBound;
        guint overlap = bottomBound - top_attach;
        while (rowList) {
            GtkWidget *widget = GTK_WIDGET (rowList->data);
            gtk_table_adjust_attach (table, widget, 0, 0, -offset, -(offset + overlap));
            rowList = rowList->next;
        }
        g_list_free (rowList);
        g_ptr_array_index (toBeMoved, offset) = NULL;
    }

    gtk_table_resize (table, n_rows - 1, n_columns);
}

/*
 * Delete a table row
 */
void gtk_table_delete_row (GtkTable *table, guint row) {
    gtk_table_delete_rows (table, row, 1);
}

NSString * gtk_editable_get_string (GtkEditable *editable, gint start, gint end)
{
    gchar *text = gtk_editable_get_chars (editable, start, end);
    NSString *string = [NSString stringWithUTF8String:text];
    g_free (text);
    return string;
}

void gtk_entry_set_string (GtkEntry *entry, NSString *string)
{
    gtk_entry_set_text (entry, string == nil ? "" : [string UTF8String]);
}

NSString * gtk_entry_get_string (GtkEntry *entry)
{
    return [NSString stringWithUTF8String:gtk_entry_get_text (entry)];
}

GdkRectangle gdk_rectangle_from_ns_rect (NSRect box) {
    GdkRectangle rect;
    rect.x = box.origin.x;
    rect.y = box.origin.y;
    rect.width = box.size.width;
    rect.height = box.size.height;
    return rect;
}

NSRect gdk_rectangle_to_ns_rect (GdkRectangle rect) {
    NSRect result;
    result.origin.x = rect.x;
    result.origin.y = rect.y;
    result.size.width = rect.width;
    result.size.height = rect.height;
    return result;
}

void gtk_action_set_detailed_label (GtkAction *action, const gchar *baseLabel, const gchar *actionName) {
  if (actionName == NULL || *actionName == '\0') {
    gtk_action_set_label (action, baseLabel);
  } else {
    GString *label = g_string_sized_new (30);
    g_string_printf(label, "%s: %s", baseLabel, actionName);
    gtk_action_set_label (action, label->str);
    g_string_free (label, TRUE);
  }
}

/**
 * tz_hijack_key_press:
 * @win: a #GtkWindow
 * event: the GdkEventKey
 * user_data: unused
 *
 * This function is meant to be attached to key-press-event of a toplevel,
 * it simply allows the window contents to treat key events /before/
 * accelerator keys come into play (this way widgets dont get deleted
 * when cutting text in an entry etc.).
 *
 * Returns: whether the event was handled
 */
gint
tz_hijack_key_press (GtkWindow    *win,
                     GdkEventKey  *event,
                     gpointer      user_data)
{
    GtkWidget *focus_widget;

    focus_widget = gtk_window_get_focus (win);
    if (focus_widget &&
        (event->keyval == GDK_Delete || /* Filter Delete from accelerator keys */
         ((event->state & GDK_CONTROL_MASK) && /* CTRL keys... */
          ((event->keyval == GDK_c || event->keyval == GDK_C) || /* CTRL-C (copy)  */
           (event->keyval == GDK_x || event->keyval == GDK_X) || /* CTRL-X (cut)   */
           (event->keyval == GDK_v || event->keyval == GDK_V) || /* CTRL-V (paste) */
           (event->keyval == GDK_a || event->keyval == GDK_A) || /* CTRL-A (select-all) */
           (event->keyval == GDK_n || event->keyval == GDK_N))))) /* CTRL-N (new document) ?? */
    {
            return gtk_widget_event (focus_widget,
                                     (GdkEvent *)event);
    }
    return FALSE;
}

// vim:ft=objc:ts=8:et:sts=4:sw=4
