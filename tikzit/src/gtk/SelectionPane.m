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

#import "SelectionPane.h"

#import "Configuration.h"
#import "EdgeStylesModel.h"
#import "NodeStylesModel.h"
#import "TikzDocument.h"

#import "gtkhelpers.h"

// {{{ Internal interfaces

static void node_style_changed_cb (GtkComboBox *widget, SelectionPane *pane);
static void apply_node_style_button_cb (GtkButton *widget, SelectionPane *pane);
static void clear_node_style_button_cb (GtkButton *widget, SelectionPane *pane);
static void edge_style_changed_cb (GtkComboBox *widget, SelectionPane *pane);
static void apply_edge_style_button_cb (GtkButton *widget, SelectionPane *pane);
static void clear_edge_style_button_cb (GtkButton *widget, SelectionPane *pane);

static void setup_style_cell_layout (GtkCellLayout *cell_layout, gint pixbuf_col, gint name_col);

@interface SelectionPane (Notifications)
- (void) nodeSelectionChanged:(NSNotification*)n;
- (void) edgeSelectionChanged:(NSNotification*)n;
@end

@interface SelectionPane (Private)
- (void) _updateNodeStyleButtons;
- (void) _updateEdgeStyleButtons;
- (NodeStyle*) _selectedNodeStyle;
- (EdgeStyle*) _selectedEdgeStyle;
- (void) _applyNodeStyle;
- (void) _clearNodeStyle;
- (void) _applyEdgeStyle;
- (void) _clearEdgeStyle;
@end

// }}}
// {{{ API

@implementation SelectionPane

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)sm {
    return [self initWithNodeStylesModel:[NodeStylesModel modelWithStyleManager:sm]
                      andEdgeStylesModel:[EdgeStylesModel modelWithStyleManager:sm]];
}

- (id) initWithNodeStylesModel:(NodeStylesModel*)nsm
            andEdgeStylesModel:(EdgeStylesModel*)esm {
    self = [super init];

    if (self) {
        nodeStylesModel = [nsm retain];
        edgeStylesModel = [esm retain];

        layout = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (layout);
        gtk_widget_show (layout);

        GtkWidget *label = gtk_label_new ("Selection");
        label_set_bold (GTK_LABEL (label));
        gtk_widget_show (label);
        gtk_box_pack_start (GTK_BOX (layout), label,
                            FALSE, FALSE, 0);

        GtkWidget *lvl1_box = gtk_vbox_new (FALSE, 0);
        gtk_box_pack_start (GTK_BOX (layout), lvl1_box,
                            FALSE, FALSE, 3);

        nodeStyleCombo = gtk_combo_box_new_with_model ([nodeStylesModel model]);
        g_object_ref_sink (nodeStyleCombo);
        setup_style_cell_layout (GTK_CELL_LAYOUT (nodeStyleCombo),
                                 NODE_STYLES_ICON_COL,
                                 NODE_STYLES_NAME_COL);
        g_signal_connect (G_OBJECT (nodeStyleCombo),
            "changed",
            G_CALLBACK (node_style_changed_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl1_box), nodeStyleCombo,
                            FALSE, FALSE, 0);

        GtkWidget *lvl2_box = gtk_hbox_new (FALSE, 0);
        gtk_box_pack_start (GTK_BOX (lvl1_box), lvl2_box,
                            FALSE, FALSE, 0);

        applyNodeStyleButton = gtk_button_new_with_label ("Apply");
        g_object_ref_sink (applyNodeStyleButton);
        gtk_widget_set_tooltip_text (applyNodeStyleButton, "Apply style to selected nodes");
        gtk_widget_set_sensitive (applyNodeStyleButton, FALSE);
        g_signal_connect (G_OBJECT (applyNodeStyleButton),
            "clicked",
            G_CALLBACK (apply_node_style_button_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl2_box), applyNodeStyleButton,
                            FALSE, FALSE, 0);

        clearNodeStyleButton = gtk_button_new_with_label ("Clear");
        g_object_ref_sink (clearNodeStyleButton);
        gtk_widget_set_tooltip_text (clearNodeStyleButton, "Clear style from selected nodes");
        gtk_widget_set_sensitive (clearNodeStyleButton, FALSE);
        g_signal_connect (G_OBJECT (clearNodeStyleButton),
            "clicked",
            G_CALLBACK (clear_node_style_button_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl2_box), clearNodeStyleButton,
                            FALSE, FALSE, 0);

        lvl1_box = gtk_vbox_new (FALSE, 0);
        gtk_box_pack_start (GTK_BOX (layout), lvl1_box,
                            FALSE, FALSE, 3);

        edgeStyleCombo = gtk_combo_box_new_with_model ([edgeStylesModel model]);
        g_object_ref_sink (edgeStyleCombo);
        setup_style_cell_layout (GTK_CELL_LAYOUT (edgeStyleCombo),
                                 EDGE_STYLES_ICON_COL,
                                 EDGE_STYLES_NAME_COL);
        g_signal_connect (G_OBJECT (edgeStyleCombo),
            "changed",
            G_CALLBACK (edge_style_changed_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl1_box), edgeStyleCombo,
                            FALSE, FALSE, 0);

        lvl2_box = gtk_hbox_new (FALSE, 0);
        gtk_box_pack_start (GTK_BOX (lvl1_box), lvl2_box,
                            FALSE, FALSE, 0);

        applyEdgeStyleButton = gtk_button_new_with_label ("Apply");
        g_object_ref_sink (applyEdgeStyleButton);
        gtk_widget_set_tooltip_text (applyEdgeStyleButton, "Apply style to selected edges");
        gtk_widget_set_sensitive (applyEdgeStyleButton, FALSE);
        g_signal_connect (G_OBJECT (applyEdgeStyleButton),
            "clicked",
            G_CALLBACK (apply_edge_style_button_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl2_box), applyEdgeStyleButton,
                            FALSE, FALSE, 0);

        clearEdgeStyleButton = gtk_button_new_with_label ("Clear");
        g_object_ref_sink (clearEdgeStyleButton);
        gtk_widget_set_tooltip_text (clearEdgeStyleButton, "Clear style from selected edges");
        gtk_widget_set_sensitive (clearEdgeStyleButton, FALSE);
        g_signal_connect (G_OBJECT (clearEdgeStyleButton),
            "clicked",
            G_CALLBACK (clear_edge_style_button_cb),
            self);
        gtk_box_pack_start (GTK_BOX (lvl2_box), clearEdgeStyleButton,
                            FALSE, FALSE, 0);

        gtk_widget_show_all (layout);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (nodeStyleCombo);
    g_object_unref (applyNodeStyleButton);
    g_object_unref (clearNodeStyleButton);
    g_object_unref (edgeStyleCombo);
    g_object_unref (applyEdgeStyleButton);
    g_object_unref (clearEdgeStyleButton);

    g_object_unref (layout);

    [nodeStylesModel release];
    [edgeStylesModel release];

    [document release];

    [super dealloc];
}

- (TikzDocument*) document {
    return document;
}

- (void) setDocument:(TikzDocument*)doc {
    if (document != nil) {
        [[NSNotificationCenter defaultCenter]
            removeObserver:self
                      name:nil
                    object:[document pickSupport]];
    }

    [doc retain];
    [document release];
    document = doc;

    if (doc != nil) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(nodeSelectionChanged:)
                                              name:@"NodeSelectionChanged" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(edgeSelectionChanged:)
                                              name:@"EdgeSelectionChanged" object:[doc pickSupport]];
    }

    [self _updateNodeStyleButtons];
    [self _updateEdgeStyleButtons];
}

- (BOOL) visible {
    return gtk_widget_get_visible (layout);
}

- (void) setVisible:(BOOL)visible {
    gtk_widget_set_visible (layout, visible);
}

- (GtkWidget*) gtkWidget {
    return layout;
}

- (void) loadConfiguration:(Configuration*)config {
    NSString *nodeStyleName = [config stringEntry:@"SelectedNodeStyle"
                                          inGroup:@"SelectionPane"
                                      withDefault:nil];
    NodeStyle *nodeStyle = [[nodeStylesModel styleManager] nodeStyleForName:nodeStyleName];
    if (nodeStyle == nil) {
        gtk_combo_box_set_active (GTK_COMBO_BOX (nodeStyleCombo), -1);
    } else {
        GtkTreeIter *iter = [nodeStylesModel iterFromStyle:nodeStyle];
        if (iter) {
            gtk_combo_box_set_active_iter (GTK_COMBO_BOX (nodeStyleCombo), iter);
            gtk_tree_iter_free (iter);
        }
    }

    NSString *edgeStyleName = [config stringEntry:@"SelectedEdgeStyle"
                                          inGroup:@"SelectionPane"
                                      withDefault:nil];
    EdgeStyle *edgeStyle = [[edgeStylesModel styleManager] edgeStyleForName:edgeStyleName];
    if (edgeStyle == nil) {
        gtk_combo_box_set_active (GTK_COMBO_BOX (edgeStyleCombo), -1);
    } else {
        GtkTreeIter *iter = [edgeStylesModel iterFromStyle:edgeStyle];
        if (iter) {
            gtk_combo_box_set_active_iter (GTK_COMBO_BOX (edgeStyleCombo), iter);
            gtk_tree_iter_free (iter);
        }
    }
}

- (void) saveConfiguration:(Configuration*)config {
    [config setStringEntry:@"SelectedNodeStyle"
                   inGroup:@"SelectionPane"
                     value:[[self _selectedNodeStyle] name]];
    [config setStringEntry:@"SelectedEdgeStyle"
                   inGroup:@"SelectionPane"
                     value:[[self _selectedEdgeStyle] name]];
}

@end

// }}}
// {{{ Notifications

@implementation SelectionPane (Notifications)
- (void) nodeSelectionChanged:(NSNotification*)n {
    [self _updateNodeStyleButtons];
}

- (void) edgeSelectionChanged:(NSNotification*)n {
    [self _updateEdgeStyleButtons];
}
@end

// }}}
// {{{ Private

@implementation SelectionPane (Private)
- (void) _updateNodeStyleButtons {
    gboolean hasNodeSelection = [[[document pickSupport] selectedNodes] count] > 0;

    gtk_widget_set_sensitive (applyNodeStyleButton,
            hasNodeSelection && [self _selectedNodeStyle] != nil);
    gtk_widget_set_sensitive (clearNodeStyleButton, hasNodeSelection);
}

- (void) _updateEdgeStyleButtons {
    gboolean hasEdgeSelection = [[[document pickSupport] selectedEdges] count] > 0;

    gtk_widget_set_sensitive (applyEdgeStyleButton,
            hasEdgeSelection && [self _selectedEdgeStyle] != nil);
    gtk_widget_set_sensitive (clearEdgeStyleButton, hasEdgeSelection);
}

- (NodeStyle*) _selectedNodeStyle {
    GtkTreeIter iter;
    if (gtk_combo_box_get_active_iter (GTK_COMBO_BOX (nodeStyleCombo), &iter)) {
        return [nodeStylesModel styleFromIter:&iter];
    } else {
        return nil;
    }
}

- (EdgeStyle*) _selectedEdgeStyle {
    GtkTreeIter iter;
    if (gtk_combo_box_get_active_iter (GTK_COMBO_BOX (edgeStyleCombo), &iter)) {
        return [edgeStylesModel styleFromIter:&iter];
    } else {
        return nil;
    }
}

- (void) _applyNodeStyle {
    [document startModifyNodes:[[document pickSupport] selectedNodes]];

    NodeStyle *style = [self _selectedNodeStyle];
    for (Node *node in [[document pickSupport] selectedNodes]) {
        [node setStyle:style];
    }

    [document endModifyNodes];
}

- (void) _clearNodeStyle {
    [document startModifyNodes:[[document pickSupport] selectedNodes]];

    for (Node *node in [[document pickSupport] selectedNodes]) {
        [node setStyle:nil];
    }

    [document endModifyNodes];
}

- (void) _applyEdgeStyle {
    [document startModifyEdges:[[document pickSupport] selectedEdges]];

    EdgeStyle *style = [self _selectedEdgeStyle];
    for (Edge *edge in [[document pickSupport] selectedEdges]) {
        [edge setStyle:style];
    }

    [document endModifyEdges];
}

- (void) _clearEdgeStyle {
    [document startModifyEdges:[[document pickSupport] selectedEdges]];

    for (Edge *edge in [[document pickSupport] selectedEdges]) {
        [edge setStyle:nil];
    }

    [document endModifyEdges];
}
@end

// }}}
// {{{ GTK+ callbacks

static void node_style_changed_cb (GtkComboBox *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _updateNodeStyleButtons];
    [pool drain];
}

static void apply_node_style_button_cb (GtkButton *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _applyNodeStyle];
    [pool drain];
}

static void clear_node_style_button_cb (GtkButton *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _clearNodeStyle];
    [pool drain];
}

static void edge_style_changed_cb (GtkComboBox *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _updateEdgeStyleButtons];
    [pool drain];
}

static void apply_edge_style_button_cb (GtkButton *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _applyEdgeStyle];
    [pool drain];
}

static void clear_edge_style_button_cb (GtkButton *widget, SelectionPane *pane) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [pane _clearEdgeStyle];
    [pool drain];
}

// }}}
//
static void setup_style_cell_layout (GtkCellLayout *cell_layout, gint pixbuf_col, gint name_col) {
    gtk_cell_layout_clear (cell_layout);
    GtkCellRenderer *pixbuf_renderer = gtk_cell_renderer_pixbuf_new ();
    gtk_cell_layout_pack_start (cell_layout, pixbuf_renderer, FALSE);
    gtk_cell_layout_set_attributes (
            cell_layout,
            pixbuf_renderer,
            "pixbuf", pixbuf_col,
            NULL);
    GtkCellRenderer *text_renderer = gtk_cell_renderer_text_new ();
    gtk_cell_layout_pack_start (cell_layout, text_renderer, FALSE);
    gtk_cell_layout_set_attributes (
            cell_layout,
            text_renderer,
            "text", name_col,
            NULL);
}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
