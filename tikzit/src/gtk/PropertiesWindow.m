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

#import "PropertiesWindow.h"

#import "Configuration.h"
#import "PropertyListEditor.h"
#import "GraphElementProperty.h"

#import "gtkhelpers.h"

// {{{ Internal interfaces
// {{{ GTK+ helpers
static GtkWidget *createLabelledEntry (const gchar *labelText, GtkEntry **entry);
static GtkWidget *createPropsPaneWithLabelEntry (PropertyListEditor *props, GtkEntry **labelEntry);
// }}}
// {{{ GTK+ callbacks
static gboolean props_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, PropertiesWindow *window);
static void node_label_changed_cb (GtkEditable *widget, PropertiesWindow *pane);
static void edge_node_label_changed_cb (GtkEditable *widget, PropertiesWindow *pane);
static void edge_node_toggled_cb (GtkToggleButton *widget, PropertiesWindow *pane);
// }}}

@interface PropertiesWindow (Notifications)
- (void) nodeSelectionChanged:(NSNotification*)n;
- (void) edgeSelectionChanged:(NSNotification*)n;
- (void) graphChanged:(NSNotification*)n;
- (void) nodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeLabelEdited:(NSString*)newValue;
- (void) edgeNodeToggled:(BOOL)newValue;
@end

@interface PropertiesWindow (Private)
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

@implementation PropertiesWindow

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

        window = gtk_window_new (GTK_WINDOW_TOPLEVEL);
        g_object_ref_sink (window);
        gtk_window_set_title (GTK_WINDOW (window), "Properties");
        gtk_window_set_role (GTK_WINDOW (window), "properties");
        gtk_window_set_type_hint (GTK_WINDOW (window),
                                  GDK_WINDOW_TYPE_HINT_UTILITY);
        gtk_window_set_default_size (GTK_WINDOW (window), 200, 500);
        g_signal_connect (G_OBJECT (window),
            "delete-event",
            G_CALLBACK (props_window_delete_event_cb),
            self);

        /*
         * Graph properties
         */
        graphPropsBin = gtk_frame_new ("Graph properties");
        gtk_container_add (GTK_CONTAINER (graphPropsBin), [graphProps widget]);
        gtk_widget_show ([graphProps widget]);
        g_object_ref_sink (graphPropsBin);
        gtk_container_add (GTK_CONTAINER (window), graphPropsBin);
        gtk_widget_show (graphPropsBin);


        /*
         * Node properties
         */
        GtkWidget *nodePropsWidget = createPropsPaneWithLabelEntry(nodeProps, &nodeLabelEntry);
        g_object_ref_sink (nodeLabelEntry);
        nodePropsBin = gtk_frame_new ("Node properties");
        g_object_ref_sink (nodePropsBin);
        gtk_container_add (GTK_CONTAINER (nodePropsBin), nodePropsWidget);
        gtk_widget_show (nodePropsBin);
        gtk_widget_show (nodePropsWidget);
        g_signal_connect (G_OBJECT (nodeLabelEntry),
            "changed",
            G_CALLBACK (node_label_changed_cb),
            self);


        /*
         * Edge properties
         */
        GtkBox *edgePropsBox = GTK_BOX (gtk_vbox_new (FALSE, 0));
	gtk_box_set_spacing (edgePropsBox, 6);
        edgePropsBin = gtk_frame_new ("Edge properties");
        g_object_ref_sink (edgePropsBin);
        gtk_container_add (GTK_CONTAINER (edgePropsBin), GTK_WIDGET (edgePropsBox));
        gtk_widget_show (edgePropsBin);
        gtk_widget_show (GTK_WIDGET (edgePropsBox));

        gtk_widget_show ([edgeProps widget]);
        gtk_box_pack_start (edgePropsBox, [edgeProps widget], FALSE, TRUE, 0);

        GtkWidget *split = gtk_hseparator_new ();
        gtk_box_pack_start (edgePropsBox, split, FALSE, FALSE, 0);
        gtk_widget_show (split);

        edgeNodeToggle = GTK_TOGGLE_BUTTON (gtk_check_button_new_with_label ("Child node"));
        g_object_ref_sink (edgeNodeToggle);
        gtk_widget_show (GTK_WIDGET (edgeNodeToggle));
        gtk_box_pack_start (edgePropsBox, GTK_WIDGET (edgeNodeToggle), FALSE, TRUE, 0);
        g_signal_connect (G_OBJECT (GTK_WIDGET (edgeNodeToggle)),
            "toggled",
            G_CALLBACK (edge_node_toggled_cb),
            self);

        edgeNodePropsWidget = createPropsPaneWithLabelEntry(edgeNodeProps, &edgeNodeLabelEntry);
        g_object_ref_sink (edgeNodePropsWidget);
        g_object_ref_sink (edgeNodeLabelEntry);
        gtk_box_pack_start (edgePropsBox, edgeNodePropsWidget, FALSE, TRUE, 0);
        g_signal_connect (G_OBJECT (edgeNodeLabelEntry),
            "changed",
            G_CALLBACK (edge_node_label_changed_cb),
            self);

    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [document release];

    g_object_unref (graphPropsBin);
    g_object_unref (nodePropsBin);
    g_object_unref (edgePropsBin);
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

    [self _updatePane];

    [doc retain];
    [document release];
    document = doc;
}

- (BOOL) visible {
    return gtk_widget_get_visible (window);
}

- (void) setVisible:(BOOL)visible {
    gtk_widget_set_visible (window, visible);
}

- (void) present {
    gtk_window_present (GTK_WINDOW (window));
}

- (void) loadConfiguration:(Configuration*)config {
    [self setVisible:[config booleanEntry:@"visible"
                                  inGroup:@"PropertiesWindow"
                              withDefault:YES]];
}

- (void) saveConfiguration:(Configuration*)config {
    [config setBooleanEntry:@"visible"
                    inGroup:@"PropertiesWindow"
                      value:[self visible]];
}

@end
// }}}
// {{{ Notifications

@implementation PropertiesWindow (Notifications)

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

@implementation PropertiesWindow (Private)

- (void) _setDisplayedWidget:(GtkWidget*)widget {
    GtkWidget *current = gtk_bin_get_child (GTK_BIN (window));
    if (current != widget) {
        gtk_container_remove (GTK_CONTAINER (window), current);
        gtk_container_add (GTK_CONTAINER (window), widget);
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
        [self _setDisplayedWidget:nodePropsBin];
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
            if ([e hasEdgeNode]) {
                gtk_toggle_button_set_active (edgeNodeToggle, TRUE);
                gtk_widget_show (edgeNodePropsWidget);
                gtk_entry_set_text (GTK_ENTRY (edgeNodeLabelEntry), [[[e edgeNode] label] UTF8String]);
                [edgeNodeProps setData:[[e edgeNode] data]];
                gtk_widget_set_sensitive (edgeNodePropsWidget, TRUE);
            } else {
                gtk_toggle_button_set_active (edgeNodeToggle, FALSE);
                gtk_widget_hide (edgeNodePropsWidget);
                gtk_entry_set_text (GTK_ENTRY (edgeNodeLabelEntry), "");
                [edgeNodeProps setData:nil];
                gtk_widget_set_sensitive (edgeNodePropsWidget, FALSE);
            }
            [self _setDisplayedWidget:edgePropsBin];
            editGraphProps = NO;
        } else {
            [edgePropDelegate setEdge:nil];
            [edgeProps setData:nil];
            [edgeNodeProps setData:nil];
            gtk_entry_set_text (edgeNodeLabelEntry, "");
        }
    }

    if (editGraphProps) {
        [self _setDisplayedWidget:graphPropsBin];
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

static gboolean props_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, PropertiesWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window setVisible:NO];
    [pool drain];
    return TRUE;
}

static void node_label_changed_cb (GtkEditable *editable, PropertiesWindow *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane nodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_label_changed_cb (GtkEditable *editable, PropertiesWindow *pane) {
    if (!gtk_widget_is_sensitive (GTK_WIDGET (editable))) {
        // clearly wasn't the user editing
        return;
    }

    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    NSString *newValue = gtk_editable_get_string (editable, 0, -1);
    [pane edgeNodeLabelEdited:newValue];

    [pool drain];
}

static void edge_node_toggled_cb (GtkToggleButton *toggle, PropertiesWindow *pane) {
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
