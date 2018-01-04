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

#import "NodeStyleEditor.h"
#import "NodeStyle.h"
#import "NodeStyle+Gtk.h"
#import "Shape.h"

static const guint row_count = 5;

// {{{ Internal interfaces
// {{{ GTK+ Callbacks
static void style_name_edit_changed_cb (GtkEditable *widget, NodeStyleEditor *editor);
static void style_shape_combo_changed_cb (GtkComboBox *widget, NodeStyleEditor *editor);
static void stroke_color_changed_cb (GtkColorButton *widget, NodeStyleEditor *editor);
static void fill_color_changed_cb (GtkColorButton *widget, NodeStyleEditor *editor);
static void make_stroke_safe_button_clicked_cb (GtkButton *widget, NodeStyleEditor *editor);
static void make_fill_safe_button_clicked_cb (GtkButton *widget, NodeStyleEditor *editor);
static void scale_adjustment_changed_cb (GtkAdjustment *widget, NodeStyleEditor *editor);
// }}}
// {{{ Notifications

@interface NodeStyleEditor (Notifications)
- (void) shapeDictionaryReplaced:(NSNotification*)n;
- (void) nameChangedTo:(NSString*)value;
- (void) shapeNameChangedTo:(NSString*)value;
- (void) strokeColorChangedTo:(GdkColor)value;
- (void) makeStrokeColorTexSafe;
- (void) fillColorChangedTo:(GdkColor)value;
- (void) makeFillColorTexSafe;
- (void) scaleChangedTo:(double)value;
@end

// }}}
// {{{ Private

@interface NodeStyleEditor (Private)
- (void) loadShapeNames;
- (void) setActiveShapeName:(NSString*)name;
@end

// }}}
// }}}
// {{{ API

@implementation NodeStyleEditor

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

- (GtkWidget*) _createMakeColorTexSafeButton:(NSString*)type {
    GtkWidget *b = gtk_button_new ();
    GtkWidget *icon = gtk_image_new_from_stock (GTK_STOCK_DIALOG_WARNING, GTK_ICON_SIZE_BUTTON);
    gtk_widget_show (icon);
    gtk_container_add (GTK_CONTAINER (b), icon);
    NSString *ttip = [NSString stringWithFormat:@"The %@ colour is not a predefined TeX colour.\nClick here to choose the nearest TeX-safe colour.", type];
    gtk_widget_set_tooltip_text (b, [ttip UTF8String]);
    return b;
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
         * Shape
         */
        GtkListStore *store = gtk_list_store_new (1, G_TYPE_STRING);
        shapeNameCombo = GTK_COMBO_BOX (gtk_combo_box_new_with_model (GTK_TREE_MODEL (store)));
        GtkCellRenderer *cellRend = gtk_cell_renderer_text_new ();
        gtk_cell_layout_pack_start (GTK_CELL_LAYOUT (shapeNameCombo),
                                    cellRend,
                                    TRUE);
        gtk_cell_layout_add_attribute (GTK_CELL_LAYOUT (shapeNameCombo), cellRend, "text", 0);
        g_object_ref_sink (shapeNameCombo);
        [self _addWidget:GTK_WIDGET (shapeNameCombo)
               withLabel:"Shape"
                   atRow:1];
        g_signal_connect (G_OBJECT (shapeNameCombo),
                          "changed",
                          G_CALLBACK (style_shape_combo_changed_cb),
                          self);


        /**
         * Stroke colour
         */
        GtkWidget *strokeBox = gtk_hbox_new (FALSE, 0);
        [self _addWidget:strokeBox
               withLabel:"Stroke colour"
                   atRow:2];
        strokeColorButton = GTK_COLOR_BUTTON (gtk_color_button_new ());
        g_object_ref_sink (strokeColorButton);
        gtk_widget_show (GTK_WIDGET (strokeColorButton));
        gtk_box_pack_start (GTK_BOX (strokeBox), GTK_WIDGET (strokeColorButton),
                            FALSE, FALSE, 0);
        makeStrokeTexSafeButton = [self _createMakeColorTexSafeButton:@"stroke"];
        g_object_ref_sink (makeStrokeTexSafeButton);
        gtk_box_pack_start (GTK_BOX (strokeBox), makeStrokeTexSafeButton,
                            FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (strokeColorButton),
                          "color-set",
                          G_CALLBACK (stroke_color_changed_cb),
                          self);
        g_signal_connect (G_OBJECT (makeStrokeTexSafeButton),
                          "clicked",
                          G_CALLBACK (make_stroke_safe_button_clicked_cb),
                          self);


        /**
         * Fill colour
         */
        GtkWidget *fillBox = gtk_hbox_new (FALSE, 0);
        [self _addWidget:fillBox
               withLabel:"Fill colour"
                   atRow:3];
        fillColorButton = GTK_COLOR_BUTTON (gtk_color_button_new ());
        g_object_ref_sink (fillColorButton);
        gtk_widget_show (GTK_WIDGET (fillColorButton));
        gtk_box_pack_start (GTK_BOX (fillBox), GTK_WIDGET (fillColorButton),
                            FALSE, FALSE, 0);
        makeFillTexSafeButton = [self _createMakeColorTexSafeButton:@"fill"];
        g_object_ref_sink (makeFillTexSafeButton);
        gtk_box_pack_start (GTK_BOX (fillBox), makeFillTexSafeButton,
                            FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (fillColorButton),
                          "color-set",
                          G_CALLBACK (fill_color_changed_cb),
                          self);
        g_signal_connect (G_OBJECT (makeFillTexSafeButton),
                          "clicked",
                          G_CALLBACK (make_fill_safe_button_clicked_cb),
                          self);


        /**
         * Scale
         */
        scaleAdj = GTK_ADJUSTMENT (gtk_adjustment_new (
            1.0,   // value
            0.0,   // lower
            50.0,  // upper
            0.20,  // step
            1.0,   // page
            0.0)); // (irrelevant)
        g_object_ref_sink (scaleAdj);
        GtkWidget *scaleSpin = gtk_spin_button_new (scaleAdj, 0.0, 2);
        [self _addWidget:scaleSpin
               withLabel:"Scale"
                   atRow:4];
        g_signal_connect (G_OBJECT (scaleAdj),
                          "value-changed",
                          G_CALLBACK (scale_adjustment_changed_cb),
                          self);

        [self loadShapeNames];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(shapeDictionaryReplaced:)
                                                     name:@"ShapeDictionaryReplaced"
                                                   object:[Shape class]];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (nameEdit);
    g_object_unref (shapeNameCombo);
    g_object_unref (strokeColorButton);
    g_object_unref (makeStrokeTexSafeButton);
    g_object_unref (fillColorButton);
    g_object_unref (makeFillTexSafeButton);
    g_object_unref (scaleAdj);
    g_object_unref (table);
    [style release];

    [super dealloc];
}

- (NodeStyle*) style {
    return style;
}

- (void) setStyle:(NodeStyle*)s {
    blockSignals = YES;
    NodeStyle *oldStyle = style;
    style = [s retain];

    if (style != nil) {
        gtk_widget_set_sensitive (GTK_WIDGET (table), TRUE);

        gtk_entry_set_text(nameEdit, [[style name] UTF8String]);

        [self setActiveShapeName:[style shapeName]];

        GdkColor c = [style strokeColor];
        gtk_color_button_set_color(strokeColorButton, &c);

        gtk_widget_set_visible (makeStrokeTexSafeButton, ([[style strokeColorRGB] name] == nil));

        c = [style fillColor];
        gtk_color_button_set_color(fillColorButton, &c);

        gtk_widget_set_visible (makeFillTexSafeButton, ([[style fillColorRGB] name] == nil));

        gtk_adjustment_set_value(scaleAdj, [style scale]);
    } else {
        gtk_entry_set_text(nameEdit, "");
        [self setActiveShapeName:nil];
        gtk_widget_set_visible (makeStrokeTexSafeButton, FALSE);
        gtk_widget_set_visible (makeFillTexSafeButton, FALSE);
        gtk_adjustment_set_value(scaleAdj, 1.0);
        gtk_widget_set_sensitive (GTK_WIDGET (table), FALSE);
    }

    [oldStyle release];
    blockSignals = NO;
}

- (GtkWidget*) widget {
    return GTK_WIDGET (table);
}

- (void) selectNameField {
    gtk_widget_grab_focus (GTK_WIDGET (nameEdit));
    gtk_editable_select_region (GTK_EDITABLE (nameEdit), 0, -1);
}

@end

// }}}
// {{{ Notifications

@implementation NodeStyleEditor (Notifications)
- (void) shapeDictionaryReplaced:(NSNotification*)n {
    blockSignals = YES;

    [self loadShapeNames];
    [self setActiveShapeName:[style shapeName]];

    blockSignals = NO;
}

- (void) nameChangedTo:(NSString*)value {
    [style setName:value];
}

- (void) shapeNameChangedTo:(NSString*)value {
    [style setShapeName:value];
}

- (void) strokeColorChangedTo:(GdkColor)value {
    [style setStrokeColor:value];
    gtk_widget_set_visible (makeStrokeTexSafeButton,
                            [[style strokeColorRGB] name] == nil);
}

- (void) makeStrokeColorTexSafe {
    if (style != nil) {
        [[style strokeColorRGB] setToClosestHashed];
        GdkColor color = [style strokeColor];
        gtk_color_button_set_color(strokeColorButton, &color);
        gtk_widget_set_visible (makeStrokeTexSafeButton, FALSE);
    }
}

- (void) fillColorChangedTo:(GdkColor)value {
    [style setFillColor:value];
    gtk_widget_set_visible (makeFillTexSafeButton,
                            [[style fillColorRGB] name] == nil);
}

- (void) makeFillColorTexSafe {
    if (style != nil) {
        [[style fillColorRGB] setToClosestHashed];
        GdkColor color = [style fillColor];
        gtk_color_button_set_color(fillColorButton, &color);
        gtk_widget_set_visible (makeFillTexSafeButton, FALSE);
    }
}

- (void) scaleChangedTo:(double)value {
    [style setScale:value];
}
@end

// }}}
// {{{ Private

@implementation NodeStyleEditor (Private)
- (BOOL) signalsBlocked { return blockSignals; }

- (void) loadShapeNames {
    blockSignals = YES;

    gtk_combo_box_set_active (shapeNameCombo, -1);

    GtkListStore *list = GTK_LIST_STORE (gtk_combo_box_get_model (shapeNameCombo));
    gtk_list_store_clear (list);

    NSEnumerator *en = [[Shape shapeDictionary] keyEnumerator];
    NSString *shapeName;
    GtkTreeIter iter;
    while ((shapeName = [en nextObject]) != nil) {
        gtk_list_store_append (list, &iter);
        gtk_list_store_set (list, &iter, 0, [shapeName UTF8String], -1);
    }

    blockSignals = NO;
}

- (void) setActiveShapeName:(NSString*)name {
    if (name == nil) {
        gtk_combo_box_set_active (shapeNameCombo, -1);
        return;
    }
    const gchar *shapeName = [name UTF8String];

    GtkTreeModel *model = gtk_combo_box_get_model (shapeNameCombo);
    GtkTreeIter iter;
    if (gtk_tree_model_get_iter_first (model, &iter)) {
        do {
            gchar *rowShapeName;
            gtk_tree_model_get (model, &iter, 0, &rowShapeName, -1);
            if (g_strcmp0 (shapeName, rowShapeName) == 0) {
                gtk_combo_box_set_active_iter (shapeNameCombo, &iter);
                g_free (rowShapeName);
                return;
            }
            g_free (rowShapeName);
        } while (gtk_tree_model_iter_next (model, &iter));
    }
}
@end

// }}}
// {{{ GTK+ callbacks

static void style_name_edit_changed_cb (GtkEditable *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    const gchar *contents = gtk_entry_get_text (GTK_ENTRY (widget));
    [editor nameChangedTo:[NSString stringWithUTF8String:contents]];

    [pool drain];
}

static void style_shape_combo_changed_cb (GtkComboBox *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    GtkTreeIter iter;
    gtk_combo_box_get_active_iter (widget, &iter);
    gchar *shapeName = NULL;
    gtk_tree_model_get (gtk_combo_box_get_model (widget), &iter, 0, &shapeName, -1);
    [editor shapeNameChangedTo:[NSString stringWithUTF8String:shapeName]];
    g_free (shapeName);

    [pool drain];
}

static void stroke_color_changed_cb (GtkColorButton *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    GdkColor color;
    gtk_color_button_get_color (widget, &color);
    [editor strokeColorChangedTo:color];

    [pool drain];
}

static void fill_color_changed_cb (GtkColorButton *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    GdkColor color;
    gtk_color_button_get_color (widget, &color);
    [editor fillColorChangedTo:color];

    [pool drain];
}

static void make_stroke_safe_button_clicked_cb (GtkButton *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor makeStrokeColorTexSafe];
    [pool drain];
}

static void make_fill_safe_button_clicked_cb (GtkButton *widget, NodeStyleEditor *editor) {
    if ([editor signalsBlocked])
        return;

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor makeFillColorTexSafe];
    [pool drain];
}

static void scale_adjustment_changed_cb (GtkAdjustment *adj, NodeStyleEditor *editor) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [editor scaleChangedTo:gtk_adjustment_get_value (adj)];
    [pool drain];
}

// }}}

// vim:ft=objc:ts=4:et:sts=4:sw=4:foldmethod=marker
