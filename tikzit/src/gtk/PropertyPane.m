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

#import "PropertyPane.h"
#import "PropertyListEditor.h"
#import "GraphElementProperty.h"
#import "gtkhelpers.h"

// {{{ Internal interfaces
// {{{ GTK+ helpers
static GtkWidget *createLabelledEntry (const gchar *labelText, GtkEntry **entry);
static GtkWidget *createPropsPaneWithLabelEntry (PropertyListEditor *props, GtkEntry **labelEntry);
// }}}
// {{{ GTK+ callbacks
static void node_label_changed_cb (GtkEditable *widget, PropertyPane *pane);
static void edge_node_label_changed_cb (GtkEditable *widget, PropertyPane *pane);
static void edge_node_toggled_cb (GtkToggleButton *widget, PropertyPane *pane);
// }}}

@interface PropertyPane (Notifications)
- (void) nodeSelectionChanged:(NSNotification*)n;
- (void) edgeSelectionChanged:(NSNotification*)n;
- (void) graphChanged:(NSNotification*)n;
- (void) nodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeToggled:(BOOL)newValue;
@end

@interface PropertyPane (Private)
- (void) updateGraphPane;
- (void) updateNodePane;
- (void) updateEdgePane;
- (void) _addSplitter;
- (GtkExpander*) _addExpanderWithName:(const gchar*)name contents:(GtkWidget*)contents;
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

@implementation PropertyPane

@synthesize widget=propertiesPane;

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

        propertiesPane = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (propertiesPane);

        /*
         * Graph properties
         */
        graphPropsExpander = [self _addExpanderWithName:"Graph properties"
                                               contents:[graphProps widget]];
        g_object_ref_sink (graphPropsExpander);


        [self _addSplitter];

        /*
         * Node properties
         */
        GtkWidget *nodePropsWidget = createPropsPaneWithLabelEntry(nodeProps, &nodeLabelEntry);
        g_object_ref (nodeLabelEntry);
        nodePropsExpander = [self _addExpanderWithName:"Node properties"
                                              contents:nodePropsWidget];
        g_object_ref (nodePropsExpander);
        g_signal_connect (G_OBJECT (nodeLabelEntry),
            "changed",
            G_CALLBACK (node_label_changed_cb),
            self);


        [self _addSplitter];

        /*
         * Edge properties
         */
        GtkBox *edgePropsBox = GTK_BOX (gtk_vbox_new (FALSE, 0));
	gtk_box_set_spacing (edgePropsBox, 6);
        edgePropsExpander = [self _addExpanderWithName:"Edge properties"
                                              contents:GTK_WIDGET (edgePropsBox)];
        g_object_ref (edgePropsExpander);

        gtk_widget_show ([edgeProps widget]);
        gtk_box_pack_start (edgePropsBox, [edgeProps widget], FALSE, TRUE, 0);

        GtkWidget *split = gtk_hseparator_new ();
        gtk_box_pack_start (edgePropsBox, split, FALSE, FALSE, 0);
        gtk_widget_show (split);

        edgeNodeToggle = GTK_TOGGLE_BUTTON (gtk_check_button_new_with_label ("Child node"));
        g_object_ref (edgeNodeToggle);
        gtk_widget_show (GTK_WIDGET (edgeNodeToggle));
        gtk_box_pack_start (edgePropsBox, GTK_WIDGET (edgeNodeToggle), FALSE, TRUE, 0);
        g_signal_connect (G_OBJECT (GTK_WIDGET (edgeNodeToggle)),
            "toggled",
            G_CALLBACK (edge_node_toggled_cb),
            self);

        edgeNodePropsWidget = createPropsPaneWithLabelEntry(edgeNodeProps, &edgeNodeLabelEntry);
        g_object_ref (edgeNodePropsWidget);
        g_object_ref (edgeNodeLabelEntry);
        gtk_widget_show (edgeNodePropsWidget);
        gtk_box_pack_start (edgePropsBox, edgeNodePropsWidget, FALSE, TRUE, 0);
        g_signal_connect (G_OBJECT (edgeNodeLabelEntry),
            "changed",
            G_CALLBACK (edge_node_label_changed_cb),
            self);


        [self _addSplitter];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [document release];

    g_object_unref (propertiesPane);
    g_object_unref (graphPropsExpander);
    g_object_unref (nodePropsExpander);
    g_object_unref (edgePropsExpander);
    g_object_unref (nodeLabelEntry);
    g_object_unref (edgeNodeToggle);
    g_object_unref (edgeNodePropsWidget);
    g_object_unref (edgeNodeLabelEntry);

    [graphProps release];
    [nodeProps release];
    [edgeProps release];
    [edgeNodeProps release];
    [graphPropDelegate release];
    [nodePropDelegate release];
    [edgePropDelegate release];

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

    [self updateGraphPane];
    [self updateNodePane];
    [self updateEdgePane];

    [doc retain];
    [document release];
    document = doc;
}

- (void) restoreUiStateFromConfig:(Configuration*)file group:(NSString*)group {
    gtk_expander_set_expanded (graphPropsExpander,
            [file booleanEntry:@"graph-props-expanded"
                       inGroup:group
                   withDefault:NO]);
    gtk_expander_set_expanded (nodePropsExpander,
            [file booleanEntry:@"node-props-expanded"
                       inGroup:group
                   withDefault:YES]);
    gtk_expander_set_expanded (edgePropsExpander,
            [file booleanEntry:@"edge-props-expanded"
                       inGroup:group
                   withDefault:NO]);
}

- (void) saveUiStateToConfig:(Configuration*)file group:(NSString*)group {
    [file setBooleanEntry:@"graph-props-expanded"
                  inGroup:group
                    value:gtk_expander_get_expanded (graphPropsExpander)];
    [file setBooleanEntry:@"node-props-expanded"
                  inGroup:group
                    value:gtk_expander_get_expanded (nodePropsExpander)];
    [file setBooleanEntry:@"edge-props-expanded"
                  inGroup:group
                    value:gtk_expander_get_expanded (edgePropsExpander)];
}

@end
// }}}
// {{{ Notifications

@implementation PropertyPane (Notifications)

- (void) nodeSelectionChanged:(NSNotification*)n {
    [self updateNodePane];
}

- (void) edgeSelectionChanged:(NSNotification*)n {
    [self updateEdgePane];
}

- (void) graphChanged:(NSNotification*)n {
    [self updateGraphPane];
    [self updateNodePane];
    [self updateEdgePane];
}

- (void) nodeLabelEdited:(NSString*)newValue {
    if (blockUpdates)
        return;

    NSSet *sel = [[document pickSupport] selectedNodes];
    if ([sel count] != 1) {
        NSLog(@"Expected single node selected; got %lu", [sel count]);
        return;
    }

    Node *node = [sel anyObject];
    [document startModifyNode:node];
    [node setLabel:newValue];
    [document endModifyNode];
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

    [document startModifyEdge:edge];
    [[edge edgeNode] setLabel:newValue];
    [document endModifyEdge];
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

@end
// }}}
// {{{ Private

@implementation PropertyPane (Private)

- (void) updateGraphPane {
    blockUpdates = YES;

    GraphElementData *data = [[document graph] data];
    [graphProps setData:data];
    gtk_widget_set_sensitive (gtk_bin_get_child (GTK_BIN (graphPropsExpander)), data != nil);

    blockUpdates = NO;
}

- (void) updateNodePane {
    blockUpdates = YES;

    NSSet *sel = [[document pickSupport] selectedNodes];
    if ([sel count] == 1) {
        Node *n = [sel anyObject];
        [nodePropDelegate setNode:n];
        [nodeProps setData:[n data]];
        gtk_entry_set_text (nodeLabelEntry, [[n label] UTF8String]);
        gtk_widget_set_sensitive (gtk_bin_get_child (GTK_BIN (nodePropsExpander)), TRUE);
    } else {
        [nodePropDelegate setNode:nil];
        [nodeProps setData:nil];
        gtk_entry_set_text (nodeLabelEntry, "");
        gtk_widget_set_sensitive (gtk_bin_get_child (GTK_BIN (nodePropsExpander)), FALSE);
    }

    blockUpdates = NO;
}

- (void) updateEdgePane {
    blockUpdates = YES;

    NSSet *sel = [[document pickSupport] selectedEdges];
    if ([sel count] == 1) {
        Edge *e = [sel anyObject];
        [edgePropDelegate setEdge:e];
        [edgeProps setData:[e data]];
        gtk_widget_set_sensitive (gtk_bin_get_child (GTK_BIN (edgePropsExpander)), TRUE);
        if ([e hasEdgeNode]) {
            gtk_toggle_button_set_active (edgeNodeToggle, TRUE);
            gtk_entry_set_text (GTK_ENTRY (edgeNodeLabelEntry), [[[e edgeNode] label] UTF8String]);
            [edgeNodeProps setData:[[e edgeNode] data]];
            gtk_widget_set_sensitive (edgeNodePropsWidget, TRUE);
        } else {
            gtk_toggle_button_set_active (edgeNodeToggle, FALSE);
            gtk_entry_set_text (GTK_ENTRY (edgeNodeLabelEntry), "");
            [edgeNodeProps setData:nil];
            gtk_widget_set_sensitive (edgeNodePropsWidget, FALSE);
        }
    } else {
        [edgePropDelegate setEdge:nil];
        [edgeProps setData:nil];
        [edgeNodeProps setData:nil];
        gtk_entry_set_text (edgeNodeLabelEntry, "");
        gtk_widget_set_sensitive (gtk_bin_get_child (GTK_BIN (edgePropsExpander)), FALSE);
    }

    blockUpdates = NO;
}

- (void) _addSplitter {
    GtkWidget *split = gtk_hseparator_new ();
    gtk_box_pack_start (GTK_BOX (propertiesPane),
                        split,
                        FALSE, // expand
                        FALSE, // fill
                        0); // padding
    gtk_widget_show (split);
}

- (GtkExpander*) _addExpanderWithName:(const gchar*)name contents:(GtkWidget*)contents {
    GtkWidget *exp = gtk_expander_new (name);
    gtk_box_pack_start (GTK_BOX (propertiesPane),
                        exp,
                        FALSE, // expand
                        TRUE, // fill
                        0); // padding
    gtk_widget_show (exp);
    gtk_container_set_border_width (GTK_CONTAINER (contents), 6);
    gtk_container_add (GTK_CONTAINER (exp), contents);
    gtk_widget_show (contents);
    return GTK_EXPANDER (exp);
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
        GtkBox *box = GTK_BOX (gtk_vbox_new (FALSE, 0));
	gtk_box_set_spacing (box, 6);

        GtkWidget *labelWidget = createLabelledEntry ("Label", labelEntry);
        gtk_widget_show (labelWidget);
        //                  box   widget          expand fill  pad
        gtk_box_pack_start (box,  labelWidget,    FALSE, TRUE, 0);
        gtk_box_pack_start (box,  [props widget], FALSE, TRUE, 0);
        gtk_widget_show ([props widget]);
        return GTK_WIDGET (box);
}

// }}}
// {{{ GTK+ callbacks

static void node_label_changed_cb (GtkEditable *editable, PropertyPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane nodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_label_changed_cb (GtkEditable *editable, PropertyPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane edgeNodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_toggled_cb (GtkToggleButton *toggle, PropertyPane *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (toggle))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    gboolean newValue = gtk_toggle_button_get_active (toggle);
    [pane edgeNodeToggled:newValue];

    [pool drain];
}

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
