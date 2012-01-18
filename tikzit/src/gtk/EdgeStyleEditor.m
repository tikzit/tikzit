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

#import "EdgeStyleEditor.h"

#import "EdgeStyle.h"
#import "Shape.h"

#include <gdk-pixbuf/gdk-pixdata.h>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpointer-sign"
#import "edgedecdata.m"
#pragma GCC diagnostic pop

enum {
    ED_NAME_COL = 0,
    ED_ICON_COL,
    ED_VALUE_COL,
    ED_N_COLS
};

static const guint row_count = 5;

// {{{ Internal interfaces
// {{{ GTK+ Callbacks
static void style_name_edit_changed_cb (GtkEditable *widget, EdgeStyleEditor *editor);
static void decoration_combo_changed_cb (GtkComboBox *widget, EdgeStyleEditor *editor);
static void thickness_adjustment_changed_cb (GtkAdjustment *widget, EdgeStyleEditor *editor);
// }}}
// {{{ Notifications

@interface EdgeStyleEditor (Notifications)
- (void) nameChangedTo:(NSString*)value;
- (void) edgeDecorationChangedTo:(EdgeDectorationStyle)value;
- (void) thicknessChangedTo:(double)value;
@end

// }}}
// {{{ Private

@interface EdgeStyleEditor (Private)
- (void) loadDecorationStylesInto:(GtkListStore*)list;
- (void) clearEdgeDecorationStyle;
- (void) setEdgeDecorationStyle:(EdgeDectorationStyle)value;
@end

// }}}
// }}}
// {{{ API

@implementation EdgeStyleEditor

- (void) _addWidget:(GtkWidget*)w withLabel:(gchar *)label atRow:(guint)row {
    NSAssert(row < row_count, @"row_count is wrong!");

    GtkWidget *l = gtk_label_new (label);
    gtk_misc_set_alignment (GTK_MISC (l), 0, 0.5);
    gtk_widget_show (l);
    gtk_widget_show (w);

    gtk_table_attach (table, l,
        0, 1, row, row+1, // l, r, t, b
        GTK_FILL, // x opts
        GTK_FILL | GTK_EXPAND, // y opts
        5, // x padding
        0); // y padding

    gtk_table_attach (table, w,
        1, 2, row, row+1, // l, r, t, b
        GTK_FILL | GTK_EXPAND, // x opts
        GTK_FILL | GTK_EXPAND, // y opts
        0, // x padding
        0); // y padding
}

- (id) init {
    self = [super init];

    if (self != nil) {
        style = nil;
        table = GTK_TABLE (gtk_table_new (row_count, 2, FALSE));
        gtk_table_set_col_spacings (table, 6);
        gtk_table_set_row_spacings (table, 6);
        gtk_widget_set_sensitive (GTK_WIDGET (table), FALSE);
        blockSignals = NO;

        /**
         * Name
         */
        nameEdit = GTK_ENTRY (gtk_entry_new ());
        g_object_ref_sink (nameEdit);
        [self _addWidget:GTK_WIDGET (nameEdit)
               withLabel:"Name"
                   atRow:0];
        g_signal_connect (G_OBJECT (nameEdit),
                          "changed",
                          G_CALLBACK (style_name_edit_changed_cb),
                          self);


        /**
         * Edge decoration style
         */
        GtkListStore *store = gtk_list_store_new (ED_N_COLS, G_TYPE_STRING, GDK_TYPE_PIXBUF, G_TYPE_INT);
        [self loadDecorationStylesInto:store];

        decorationCombo = GTK_COMBO_BOX (gtk_combo_box_new_with_model (GTK_TREE_MODEL (store)));
        g_object_unref (store);
        GtkCellRenderer *cellRend = gtk_cell_renderer_pixbuf_new ();
        gtk_cell_layout_pack_start (GTK_CELL_LAYOUT (decorationCombo),
                                    cellRend,
                                    TRUE);
        gtk_cell_layout_add_attribute (GTK_CELL_LAYOUT (decorationCombo), cellRend, "pixbuf", ED_ICON_COL);
        g_object_ref_sink (decorationCombo);

        [self _addWidget:GTK_WIDGET (decorationCombo)
               withLabel:"Decoration"
                   atRow:1];
        g_signal_connect (G_OBJECT (decorationCombo),
                          "changed",
                          G_CALLBACK (decoration_combo_changed_cb),
                          self);


        /**
         * Thickness
         */
        thicknessAdj = GTK_ADJUSTMENT (gtk_adjustment_new (
            1.0,   // value
            0.0,   // lower
            50.0,  // upper
            0.20,  // step
            1.0,   // page
            0.0)); // (irrelevant)
        g_object_ref_sink (thicknessAdj);
        GtkWidget *scaleSpin = gtk_spin_button_new (thicknessAdj, 0.0, 2);
        [self _addWidget:scaleSpin
               withLabel:"Thickness"
                   atRow:4];
        g_signal_connect (G_OBJECT (thicknessAdj),
                          "value-changed",
                          G_CALLBACK (thickness_adjustment_changed_cb),
                          self);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (nameEdit);
    g_object_unref (decorationCombo);
    g_object_unref (thicknessAdj);
    g_object_unref (table);
    [style release];

    [super dealloc];
}

- (EdgeStyle*) style {
    return style;
}

- (void) setStyle:(EdgeStyle*)s {
    blockSignals = YES;
    EdgeStyle *oldStyle = style;
    style = [s retain];

    if (style != nil) {
        gtk_widget_set_sensitive (GTK_WIDGET (table), TRUE);

        gtk_entry_set_text(nameEdit, [[style name] UTF8String]);

        [self setEdgeDecorationStyle:[style decorationStyle]];

        gtk_adjustment_set_value(thicknessAdj, [style thickness]);
    } else {
        gtk_entry_set_text(nameEdit, "");
        [self clearEdgeDecorationStyle];
        gtk_adjustment_set_value(thicknessAdj, 1.0);
        gtk_widget_set_sensitive (GTK_WIDGET (table), FALSE);
    }

    [oldStyle release];
    blockSignals = NO;
}

- (GtkWidget*) widget {
    return GTK_WIDGET (table);
}

@end

// }}}
// {{{ Notifications

@implementation EdgeStyleEditor (Notifications)
- (void) nameChangedTo:(NSString*)value {
    [style setName:value];
}

- (void) edgeDecorationChangedTo:(EdgeDectorationStyle)value {
    [style setDecorationStyle:value];
}

- (void) thicknessChangedTo:(double)value {
    [style setThickness:(float)value];
}
@end

// }}}
// {{{ Private

@implementation EdgeStyleEditor (Private)
- (BOOL) signalsBlocked { return blockSignals; }

- (void) loadDecorationStylesInto:(GtkListStore*)list {
    GtkTreeIter iter;

    GdkPixbuf *buf = gdk_pixbuf_from_pixdata (&ED_none_pixdata, FALSE, NULL);
    gtk_list_store_append (list, &iter);
    gtk_list_store_set (list, &iter,
            ED_NAME_COL, "None",
            ED_ICON_COL, buf,
            ED_VALUE_COL, ED_None,
            -1);
    g_object_unref (buf);

    buf = gdk_pixbuf_from_pixdata (&ED_arrow_pixdata, FALSE, NULL);
    gtk_list_store_append (list, &iter);
    gtk_list_store_set (list, &iter,
            ED_NAME_COL, "Arrow",
            ED_ICON_COL, buf,
            ED_VALUE_COL, ED_Arrow,
            -1);
    g_object_unref (buf);

    buf = gdk_pixbuf_from_pixdata (&ED_tick_pixdata, FALSE, NULL);
    gtk_list_store_append (list, &iter);
    gtk_list_store_set (list, &iter,
            ED_NAME_COL, "Tick",
            ED_ICON_COL, buf,
            ED_VALUE_COL, ED_Tick,
            -1);
    g_object_unref (buf);
}

- (void) clearEdgeDecorationStyle {
    gtk_combo_box_set_active (decorationCombo, -1);
}

- (void) setEdgeDecorationStyle:(EdgeDectorationStyle)value {
    GtkTreeModel *model = gtk_combo_box_get_model (decorationCombo);
    GtkTreeIter iter;
    if (gtk_tree_model_get_iter_first (model, &iter)) {
        do {
            EdgeDectorationStyle ed_style;
            gtk_tree_model_get (model, &iter, ED_VALUE_COL, &ed_style, -1);
            if (ed_style == value) {
                gtk_combo_box_set_active_iter (decorationCombo, &iter);
                return;
            }
        } while (gtk_tree_model_iter_next (model, &iter));
    }
}
@end

// }}}
// {{{ GTK+ callbacks

static void style_name_edit_changed_cb (GtkEditable *widget, EdgeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    const gchar *contents = gtk_entry_get_text (GTK_ENTRY (widget));
    [editor nameChangedTo:[NSString stringWithUTF8String:contents]];

    [pool drain];
}

static void decoration_combo_changed_cb (GtkComboBox *widget, EdgeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    GtkTreeIter iter;
    gtk_combo_box_get_active_iter (widget, &iter);
    EdgeDectorationStyle dec = ED_None;
    gtk_tree_model_get (gtk_combo_box_get_model (widget), &iter, ED_VALUE_COL, &dec, -1);
    [editor edgeDecorationChangedTo:dec];

    [pool drain];
}

static void thickness_adjustment_changed_cb (GtkAdjustment *adj, EdgeStyleEditor *editor) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor thicknessChangedTo:gtk_adjustment_get_value (adj)];
    [pool drain];
}

// }}}

// vim:ft=objc:ts=4:et:sts=4:sw=4:foldmethod=marker
