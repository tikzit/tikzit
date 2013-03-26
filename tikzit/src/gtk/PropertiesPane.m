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

#import "PropertiesPane.h"

#import "GraphElementProperty.h"
#import "PropertyListEditor.h"
#import "TikzDocument.h"

#import "gtkhelpers.h"

// {{{ Internal interfaces
// {{{ GTK+ helpers
static GtkWidget *createLabelledEntry (const gchar *labelText, GtkEntry **entry);
static GtkWidget *createPropsPaneWithLabelEntry (PropertyListEditor *props, GtkEntry **labelEntry);
static GtkWidget *createBoldLabel (const gchar *text);
// }}}
// {{{ GTK+ callbacks
static void node_label_changed_cb (GtkEditable *widget, PropertiesPane *pane);
static void edge_node_label_changed_cb (GtkEditable *widget, PropertiesPane *pane);
static void edge_node_toggled_cb (GtkToggleButton *widget, PropertiesPane *pane);
static void edge_source_anchor_changed_cb (GtkEditable *widget, PropertiesPane *pane);
static void edge_target_anchor_changed_cb (GtkEditable *widget, PropertiesPane *pane);
// }}}

@interface PropertiesPane (Notifications)
- (void) nodeSelectionChanged:(NSNotification*)n;
- (void) edgeSelectionChanged:(NSNotification*)n;
- (void) graphChanged:(NSNotification*)n;
- (void) nodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeToggled:(BOOL)newValue;
- (BOOL) edgeSourceAnchorEdited:(NSString*)newValue;
- (BOOL) edgeTargetAnchorEdited:(NSString*)newValue;
@end

@interface PropertiesPane (Private)
- (void) _updatePane;
- (void) _setDisplayedWidget:(GtkWidget*)widget;
@end

// {{{ Delegates

@interface GraphPropertyDelegate : NSObject<PropertyChangeDelegate> {
    TikzDocument *doc;
}
- (void) setDocument:(TikzDocument*)d;
@end

@interface NodePropertyDelegate : NSObject<PropertyChangeDelegate> {
    TikzDocument *doc;
    Node *node;
}
- (void) setDocument:(TikzDocument*)d;
- (void) setNode:(Node*)n;
@end

@interface EdgePropertyDelegate : NSObject<PropertyChangeDelegate> {
    TikzDocument *doc;
    Edge *edge;
}
- (void) setDocument:(TikzDocument*)d;
- (void) setEdge:(Edge*)e;
@end

// }}}

// }}}
// {{{ API

@implementation PropertiesPane

- (id) init {
    self = [super init];

    if (self) {
        document = nil;
        blockUpdates = NO;

        graphProps = [[PropertyListEditor alloc] init];
        graphPropDelegate = [[GraphPropertyDelegate alloc] init];
        [graphProps setDelegate:graphPropDelegate];

        nodeProps = [[PropertyListEditor alloc] init];
        nodePropDelegate = [[NodePropertyDelegate alloc] init];
        [nodeProps setDelegate:nodePropDelegate];

        edgeProps = [[PropertyListEditor alloc] init];
        edgePropDelegate = [[EdgePropertyDelegate alloc] init];
        [edgeProps setDelegate:edgePropDelegate];

        edgeNodeProps = [[PropertyListEditor alloc] init];
        [edgeNodeProps setDelegate:edgePropDelegate];

        layout = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (layout);
        gtk_widget_show (layout);

        /*
         * Graph properties
         */
        graphPropsWidget = gtk_vbox_new (FALSE, 6);
        g_object_ref_sink (graphPropsWidget);
        gtk_widget_show (graphPropsWidget);

        GtkWidget *label = createBoldLabel ("Graph properties");
        gtk_widget_show (label);
        gtk_box_pack_start (GTK_BOX (graphPropsWidget),
                            label,
                            FALSE, FALSE, 0);

        gtk_widget_show ([graphProps widget]);
        gtk_box_pack_start (GTK_BOX (graphPropsWidget),
                            [graphProps widget],
                            TRUE, TRUE, 0);

        gtk_box_pack_start (GTK_BOX (layout),
                            graphPropsWidget,
                            TRUE, TRUE, 0);


        /*
         * Node properties
         */
        nodePropsWidget = gtk_vbox_new (FALSE, 6);
        g_object_ref_sink (nodePropsWidget);
        gtk_box_pack_start (GTK_BOX (layout),
                            nodePropsWidget,
                            TRUE, TRUE, 0);

        label = createBoldLabel ("Node properties");
        gtk_widget_show (label);
        gtk_box_pack_start (GTK_BOX (nodePropsWidget),
                            label,
                            FALSE, FALSE, 0);

        GtkWidget *labelWidget = createLabelledEntry ("Label", &nodeLabelEntry);
        gtk_widget_show (labelWidget);
        gtk_box_pack_start (GTK_BOX (nodePropsWidget),
                            labelWidget,
                            FALSE, FALSE, 0);

        gtk_widget_show ([nodeProps widget]);
        gtk_box_pack_start (GTK_BOX (nodePropsWidget),
                            [nodeProps widget],
                            TRUE, TRUE, 0);

        g_signal_connect (G_OBJECT (nodeLabelEntry),
            "changed",
            G_CALLBACK (node_label_changed_cb),
            self);

        /*
         * Edge properties
         */
        edgePropsWidget = gtk_vbox_new (FALSE, 6);
        g_object_ref_sink (edgePropsWidget);
        gtk_box_pack_start (GTK_BOX (layout),
                            edgePropsWidget,
                            TRUE, TRUE, 0);

        label = createBoldLabel ("Edge properties");
        gtk_widget_show (label);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            label,
                            FALSE, FALSE, 0);

        gtk_widget_show ([edgeProps widget]);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            [edgeProps widget],
                            TRUE, TRUE, 0);

        GtkWidget *split = gtk_hseparator_new ();
        gtk_widget_show (split);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            split,
                            FALSE, FALSE, 0);

        GtkWidget *anchorTable = gtk_table_new (2, 2, FALSE);

        label = gtk_label_new ("Source anchor:");
        gtk_table_attach_defaults (GTK_TABLE (anchorTable), label,
                                   0, 1, 0, 1);
        edgeSourceAnchorEntry = GTK_ENTRY (gtk_entry_new ());
        g_object_ref_sink (edgeSourceAnchorEntry);
        gtk_table_attach_defaults (GTK_TABLE (anchorTable),
                                   GTK_WIDGET (edgeSourceAnchorEntry),
                                   1, 2, 0, 1);
        g_signal_connect (G_OBJECT (edgeSourceAnchorEntry),
            "changed",
            G_CALLBACK (edge_source_anchor_changed_cb),
            self);

        label = gtk_label_new ("Target anchor:");
        gtk_table_attach_defaults (GTK_TABLE (anchorTable), label,
                                   0, 1, 1, 2);
        edgeTargetAnchorEntry = GTK_ENTRY (gtk_entry_new ());
        g_object_ref_sink (edgeTargetAnchorEntry);
        gtk_table_attach_defaults (GTK_TABLE (anchorTable),
                                   GTK_WIDGET (edgeTargetAnchorEntry),
                                   1, 2, 1, 2);
        g_signal_connect (G_OBJECT (edgeTargetAnchorEntry),
            "changed",
            G_CALLBACK (edge_target_anchor_changed_cb),
            self);

        gtk_widget_show_all (anchorTable);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            anchorTable,
                            FALSE, FALSE, 0);

        split = gtk_hseparator_new ();
        gtk_widget_show (split);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            split,
                            FALSE, FALSE, 0);

        edgeNodeToggle = GTK_TOGGLE_BUTTON (gtk_check_button_new_with_label ("Child node"));
        g_object_ref_sink (edgeNodeToggle);
        gtk_widget_show (GTK_WIDGET (edgeNodeToggle));
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            GTK_WIDGET (edgeNodeToggle),
                            FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (GTK_WIDGET (edgeNodeToggle)),
            "toggled",
            G_CALLBACK (edge_node_toggled_cb),
            self);

        edgeNodePropsWidget = createPropsPaneWithLabelEntry(edgeNodeProps, &edgeNodeLabelEntry);
        g_object_ref_sink (edgeNodePropsWidget);
        g_object_ref_sink (edgeNodeLabelEntry);
        gtk_box_pack_start (GTK_BOX (edgePropsWidget),
                            edgeNodePropsWidget,
                            TRUE, TRUE, 0);
        g_signal_connect (G_OBJECT (edgeNodeLabelEntry),
            "changed",
            G_CALLBACK (edge_node_label_changed_cb),
            self);

        /*
         * Misc setup
         */

        [self _setDisplayedWidget:graphPropsWidget];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (graphPropsWidget);
    g_object_unref (nodePropsWidget);
    g_object_unref (edgePropsWidget);

    g_object_unref (nodeLabelEntry);
    g_object_unref (edgeNodeToggle);
    g_object_unref (edgeNodePropsWidget);
    g_object_unref (edgeNodeLabelEntry);
    g_object_unref (edgeSourceAnchorEntry);
    g_object_unref (edgeTargetAnchorEntry);

    g_object_unref (layout);

    [graphProps release];
    [nodeProps release];
    [edgeProps release];
    [edgeNodeProps release];

    [graphPropDelegate release];
    [nodePropDelegate release];
    [edgePropDelegate release];

    [document release];

    [super dealloc];
}

- (TikzDocument*) document {
    return document;
}

- (void) setDocument:(TikzDocument*)doc {
    if (document != nil) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:document];
        [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:[document pickSupport]];
    }

    [doc retain];
    [document release];
    document = doc;

    [graphPropDelegate setDocument:doc];
    [nodePropDelegate setDocument:doc];
    [edgePropDelegate setDocument:doc];

    if (doc != nil) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(nodeSelectionChanged:)
                                              name:@"NodeSelectionChanged" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(edgeSelectionChanged:)
                                              name:@"EdgeSelectionChanged" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                              selector:@selector(graphChanged:)
                                              name:@"TikzChanged" object:doc];
    }

    [self _updatePane];
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
}

- (void) saveConfiguration:(Configuration*)config {
}

@end
// }}}
// {{{ Notifications

@implementation PropertiesPane (Notifications)

- (void) nodeSelectionChanged:(NSNotification*)n {
    [self _updatePane];
}

- (void) edgeSelectionChanged:(NSNotification*)n {
    [self _updatePane];
}

- (void) graphChanged:(NSNotification*)n {
    [self _updatePane];
}

- (void) nodeLabelEdited:(NSString*)newValue {
    if (blockUpdates)
        return;

    NSSet *sel = [[document pickSupport] selectedNodes];
    if ([sel count] != 1) {
        NSLog(@"Expected single node selected; got %lu", [sel count]);
        return;
    }

    if ([newValue isValidTikzPropertyNameOrValue]) {
        Node *node = [sel anyObject];
        [document startModifyNode:node];
        [node setLabel:newValue];
        [document endModifyNode];
    } else {
        widget_set_error (GTK_WIDGET (nodeLabelEntry));
    }
}

- (void) edgeNodeLabelEdited:(NSString*)newValue {
    if (blockUpdates)
        return;

    NSSet *sel = [[document pickSupport] selectedEdges];
    if ([sel count] != 1) {
        NSLog(@"Expected single edge selected; got %lu", [sel count]);
        return;
    }

    Edge *edge = [sel anyObject];
    if (![edge hasEdgeNode]) {
        NSLog(@"Expected edge with edge node");
        return;
    }

    if ([newValue isValidTikzPropertyNameOrValue]) {
        [document startModifyEdge:edge];
        [[edge edgeNode] setLabel:newValue];
        [document endModifyEdge];
    } else {
        widget_set_error (GTK_WIDGET (edgeNodeLabelEntry));
    }
}

- (void) edgeNodeToggled:(BOOL)newValue {
    if (blockUpdates)
        return;

    NSSet *sel = [[document pickSupport] selectedEdges];
    if ([sel count] != 1) {
        NSLog(@"Expected single edge selected; got %lu", [sel count]);
        return;
    }

    Edge *edge = [sel anyObject];

    [document startModifyEdge:edge];
    [edge setHasEdgeNode:newValue];
    [document endModifyEdge];
}

- (BOOL) edgeSourceAnchorEdited:(NSString*)newValue {
    if (blockUpdates)
        return YES;

    NSSet *sel = [[document pickSupport] selectedEdges];
    if ([sel count] != 1) {
        NSLog(@"Expected single edge selected; got %lu", [sel count]);
        return YES;
    }

    Edge *edge = [sel anyObject];
    if ([newValue isValidAnchor]) {
        [document startModifyEdge:edge];
        [edge setSourceAnchor:newValue];
        [document endModifyEdge];
        return YES;
    } else {
        return NO;
    }
}

- (BOOL) edgeTargetAnchorEdited:(NSString*)newValue {
    if (blockUpdates)
        return YES;

    NSSet *sel = [[document pickSupport] selectedEdges];
    if ([sel count] != 1) {
        NSLog(@"Expected single edge selected; got %lu", [sel count]);
        return YES;
    }

    Edge *edge = [sel anyObject];
    if ([newValue isValidAnchor]) {
        [document startModifyEdge:edge];
        [edge setTargetAnchor:newValue];
        [document endModifyEdge];
        return YES;
    } else {
        return NO;
    }
}

@end
// }}}
// {{{ Private

@implementation PropertiesPane (Private)

- (void) _setDisplayedWidget:(GtkWidget*)widget {
    if (currentPropsWidget != widget) {
        if (currentPropsWidget)
            gtk_widget_hide (currentPropsWidget);
        currentPropsWidget = widget;
        if (widget)
            gtk_widget_show (widget);
    }
}

- (void) _updatePane {
    blockUpdates = YES;

    BOOL editGraphProps = YES;
    GraphElementData *data = [[document graph] data];
    [graphProps setData:data];

    NSSet *nodeSel = [[document pickSupport] selectedNodes];
    if ([nodeSel count] == 1) {
        Node *n = [nodeSel anyObject];
        [nodePropDelegate setNode:n];
        [nodeProps setData:[n data]];
        gtk_entry_set_text (nodeLabelEntry, [[n label] UTF8String]);
        widget_clear_error (GTK_WIDGET (nodeLabelEntry));
        [self _setDisplayedWidget:nodePropsWidget];
        editGraphProps = NO;
    } else {
        [nodePropDelegate setNode:nil];
        [nodeProps setData:nil];
        gtk_entry_set_text (nodeLabelEntry, "");

        NSSet *edgeSel = [[document pickSupport] selectedEdges];
        if ([edgeSel count] == 1) {
            Edge *e = [edgeSel anyObject];
            [edgePropDelegate setEdge:e];
            [edgeProps setData:[e data]];
            gtk_entry_set_text (edgeSourceAnchorEntry,
                                [[e sourceAnchor] UTF8String]);
            gtk_entry_set_text (edgeTargetAnchorEntry,
                                [[e targetAnchor] UTF8String]);
            widget_clear_error (GTK_WIDGET (edgeSourceAnchorEntry));
            widget_clear_error (GTK_WIDGET (edgeTargetAnchorEntry));
            widget_clear_error (GTK_WIDGET (edgeNodeLabelEntry));
            if ([e hasEdgeNode]) {
                gtk_toggle_button_set_active (edgeNodeToggle, TRUE);
                gtk_widget_show (edgeNodePropsWidget);
                gtk_entry_set_text (edgeNodeLabelEntry, [[[e edgeNode] label] UTF8String]);
                [edgeNodeProps setData:[[e edgeNode] data]];
                gtk_widget_set_sensitive (edgeNodePropsWidget, TRUE);
            } else {
                gtk_toggle_button_set_active (edgeNodeToggle, FALSE);
                gtk_widget_hide (edgeNodePropsWidget);
                gtk_entry_set_text (edgeNodeLabelEntry, "");
                [edgeNodeProps setData:nil];
                gtk_widget_set_sensitive (edgeNodePropsWidget, FALSE);
            }
            [self _setDisplayedWidget:edgePropsWidget];
            editGraphProps = NO;
        } else {
            [edgePropDelegate setEdge:nil];
            [edgeProps setData:nil];
            [edgeNodeProps setData:nil];
            gtk_entry_set_text (edgeNodeLabelEntry, "");
        }
    }

    if (editGraphProps) {
        [self _setDisplayedWidget:graphPropsWidget];
    }

    blockUpdates = NO;
}

@end

// }}}
// {{{ Delegates

@implementation GraphPropertyDelegate
- (id) init {
    self = [super init];
    if (self) {
        doc = nil;
    }
    return self;
}
- (void) dealloc {
    // doc is not retained
    [super dealloc];
}
- (void) setDocument:(TikzDocument*)d {
    doc = d;
}
- (BOOL)startEdit {
    if ([doc graph] != nil) {
        [doc startChangeGraphProperties];
        return YES;
    }
    return NO;
}
- (void)endEdit {
    [doc endChangeGraphProperties];
}
- (void)cancelEdit {
    [doc cancelChangeGraphProperties];
}
@end

@implementation NodePropertyDelegate
- (id) init {
    self = [super init];
    if (self) {
        doc = nil;
        node = nil;
    }
    return self;
}
- (void) dealloc {
    // doc,node not retained
    [super dealloc];
}
- (void) setDocument:(TikzDocument*)d {
    doc = d;
    node = nil;
}
- (void) setNode:(Node*)n {
    node = n;
}
- (BOOL)startEdit {
    if (node != nil) {
        [doc startModifyNode:node];
        return YES;
    }
    return NO;
}
- (void)endEdit {
    [doc endModifyNode];
}
- (void)cancelEdit {
    [doc cancelModifyNode];
}
@end

@implementation EdgePropertyDelegate
- (id) init {
    self = [super init];
    if (self) {
        doc = nil;
        edge = nil;
    }
    return self;
}
- (void) dealloc {
    // doc,edge not retained
    [super dealloc];
}
- (void) setDocument:(TikzDocument*)d {
    doc = d;
    edge = nil;
}
- (void) setEdge:(Edge*)e {
    edge = e;
}
- (BOOL)startEdit {
    if (edge != nil) {
        [doc startModifyEdge:edge];
        return YES;
    }
    return NO;
}
- (void)endEdit {
    [doc endModifyEdge];
}
- (void)cancelEdit {
    [doc cancelModifyEdge];
}
@end

// }}}
// {{{ GTK+ helpers

static GtkWidget *createLabelledEntry (const gchar *labelText, GtkEntry **entry) {
        GtkBox *box = GTK_BOX (gtk_hbox_new (FALSE, 0));
        GtkWidget *label = gtk_label_new (labelText);
        gtk_widget_show (label);
        GtkWidget *entryWidget = gtk_entry_new ();
        gtk_widget_show (entryWidget);
        //                  container  widget       expand fill  pad
        gtk_box_pack_start (box,       label,       FALSE, TRUE, 5);
        gtk_box_pack_start (box,       entryWidget, TRUE,  TRUE, 0);
        if (entry)
            *entry = GTK_ENTRY (entryWidget);
        return GTK_WIDGET (box);
}

static GtkWidget *createPropsPaneWithLabelEntry (PropertyListEditor *props, GtkEntry **labelEntry) {
        GtkBox *box = GTK_BOX (gtk_vbox_new (FALSE, 6));

        GtkWidget *labelWidget = createLabelledEntry ("Label", labelEntry);
        gtk_widget_show (labelWidget);
        //                  box   widget          expand fill   pad
        gtk_box_pack_start (box,  labelWidget,    FALSE, FALSE, 0);
        gtk_box_pack_start (box,  [props widget], TRUE,  TRUE,  0);
        gtk_widget_show ([props widget]);
        return GTK_WIDGET (box);
}

static GtkWidget *createBoldLabel (const gchar *text) {
    GtkWidget *label = gtk_label_new (text);
    label_set_bold (GTK_LABEL (label));
    return label;
}

// }}}
// {{{ GTK+ callbacks

static void node_label_changed_cb (GtkEditable *editable, PropertiesPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane nodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_label_changed_cb (GtkEditable *editable, PropertiesPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane edgeNodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_toggled_cb (GtkToggleButton *toggle, PropertiesPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (toggle))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    gboolean newValue = gtk_toggle_button_get_active (toggle);
    [pane edgeNodeToggled:newValue];

    [pool drain];
}

static void edge_source_anchor_changed_cb (GtkEditable *editable, PropertiesPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    if (![pane edgeSourceAnchorEdited:newValue])
        widget_set_error (GTK_WIDGET (editable));

    [pool drain];
}

static void edge_target_anchor_changed_cb (GtkEditable *editable, PropertiesPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    if (![pane edgeTargetAnchorEdited:newValue])
        widget_set_error (GTK_WIDGET (editable));

    [pool drain];
}

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
