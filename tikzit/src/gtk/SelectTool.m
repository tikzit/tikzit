/*
 * Copyright 2012  Alex Merry <alex.merry@kdemail.net>
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

#import "SelectTool.h"

#import "Configuration.h"
#import "Edge+Render.h"
#import "GraphRenderer.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

#define DRAG_SELECT_MODE_KEY "tikzit-drag-select-mode"

static const InputMask unionSelectMask = ShiftMask;

static void drag_select_mode_cb (GtkToggleButton *button, SelectTool *tool);

@interface SelectTool (Private)
- (TikzDocument*) doc;
- (void) shiftNodesByMovingLeader:(Node*)leader to:(NSPoint)to;
- (void) deselectAllNodes;
- (void) deselectAllEdges;
- (void) deselectAll;
- (BOOL) circleWithCenter:(NSPoint)c andRadius:(float)r containsPoint:(NSPoint)p;
- (void) lookForControlPointAt:(NSPoint)pos;
- (void) setSelectionBox:(NSRect)box;
- (void) clearSelectionBox;
- (BOOL) selectionBoxContainsNode:(Node*)node;
@end

@implementation SelectTool
- (NSString*) name { return @"Select Tool"; }
- (const gchar*) stockId { return TIKZIT_STOCK_SELECT; }
- (NSString*) helpText { return @"Select, move and edit nodes and edges"; }
- (NSString*) shortcut { return @"s"; }
@synthesize configurationWidget=configWidget;
@synthesize edgeFuzz;

+ (id) tool {
    return [[[self alloc] init] autorelease];
}

- (id) init {
    self = [super init];

    if (self) {
        state = QuietState;
        edgeFuzz = 3.0f;
        dragSelectMode = DragSelectsNodes;

        configWidget = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (configWidget);

        GtkWidget *label = gtk_label_new ("Drag selects:");
        gtk_misc_set_alignment (GTK_MISC (label), 0.0, 0.5);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            label,
                            FALSE,
                            FALSE,
                            0);

        GtkWidget *nodeOpt = gtk_radio_button_new_with_label (NULL, "nodes");
        g_object_set_data (G_OBJECT (nodeOpt),
                           DRAG_SELECT_MODE_KEY,
                           (gpointer)DragSelectsNodes);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            nodeOpt,
                            FALSE,
                            FALSE,
                            0);
        g_signal_connect (G_OBJECT (nodeOpt),
                          "toggled",
                          G_CALLBACK (drag_select_mode_cb),
                          self);

        GtkWidget *edgeOpt = gtk_radio_button_new_with_label (
                gtk_radio_button_get_group (GTK_RADIO_BUTTON (nodeOpt)),
                "edges");
        g_object_set_data (G_OBJECT (edgeOpt),
                           DRAG_SELECT_MODE_KEY,
                           (gpointer)DragSelectsEdges);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            edgeOpt,
                            FALSE,
                            FALSE,
                            0);
        g_signal_connect (G_OBJECT (edgeOpt),
                          "toggled",
                          G_CALLBACK (drag_select_mode_cb),
                          self);

        GtkWidget *bothOpt = gtk_radio_button_new_with_label (
                gtk_radio_button_get_group (GTK_RADIO_BUTTON (edgeOpt)),
                "both");
        g_object_set_data (G_OBJECT (bothOpt),
                           DRAG_SELECT_MODE_KEY,
                           (gpointer)DragSelectsBoth);
        gtk_box_pack_start (GTK_BOX (configWidget),
                            bothOpt,
                            FALSE,
                            FALSE,
                            0);
        g_signal_connect (G_OBJECT (bothOpt),
                          "toggled",
                          G_CALLBACK (drag_select_mode_cb),
                          self);
        dragSelectModeButtons = gtk_radio_button_get_group (GTK_RADIO_BUTTON (bothOpt));

        gtk_widget_show_all (configWidget);
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];
    [leaderNode release];
    [modifyEdge release];

    g_object_unref (G_OBJECT (configWidget));

    [super dealloc];
}

- (DragSelectMode) dragSelectMode {
    return dragSelectMode;
}

- (void) setDragSelectMode:(DragSelectMode)mode {
    if (dragSelectMode == mode)
        return;

    dragSelectMode = mode;

    GSList *entry = dragSelectModeButtons;
    while (entry) {
        GtkToggleButton *button = GTK_TOGGLE_BUTTON (entry->data);
        DragSelectMode buttonMode =
            (DragSelectMode) g_object_get_data (
                    G_OBJECT (button),
                    DRAG_SELECT_MODE_KEY);
        if (buttonMode == dragSelectMode) {
            gtk_toggle_button_set_active (button, TRUE);
            break;
        }

        entry = g_slist_next (entry);
    }
}

- (GraphRenderer*) activeRenderer { return renderer; }
- (void) setActiveRenderer:(GraphRenderer*)r {
    if (r == renderer)
        return;

    [r retain];
    [renderer release];
    renderer = r;

    state = QuietState;
}

- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    dragOrigin = pos;

    // we should already be in a quiet state, but no harm in making sure
    state = QuietState;

    modifyEdge = nil;
    [self lookForControlPointAt:pos];

    if (modifyEdge == nil) {
        // we didn't find a control point

        BOOL unionSelect = (mask & unionSelectMask);

        leaderNode = [renderer anyNodeAt:pos];
        // if we hit a node, deselect other nodes (if Shift is up) and go to move mode
        if (leaderNode != nil) {
            BOOL alreadySelected = [[self doc] isNodeSelected:leaderNode];
            if (!unionSelect && !alreadySelected) {
                [self deselectAll];
            }
            if (unionSelect && alreadySelected) {
                state = ToggleSelectState;
            } else {
                [[[self doc] pickSupport] selectNode:leaderNode];
                state = MoveSelectedNodesState;
                oldLeaderPos = [leaderNode point];
                [[self doc] startShiftNodes:[[[self doc] pickSupport] selectedNodes]];
            }
        }

        // if mouse did not hit a node, check if mouse hit an edge
        if (leaderNode == nil) {
            Edge *edge = [renderer anyEdgeAt:pos withFuzz:edgeFuzz];
            if (edge != nil) {
                BOOL alreadySelected = [[self doc] isEdgeSelected:edge];
                if (!unionSelect) {
                    [self deselectAll];
                }
                if (unionSelect && alreadySelected) {
                    [[[self doc] pickSupport] deselectEdge:edge];
                } else {
                    [[[self doc] pickSupport] selectEdge:edge];
                }
            } else {
                // if mouse did not hit anything, put us in box mode
                if (!unionSelect) {
                    [self deselectAll];
                }
                [renderer clearHighlightedNodes];
                state = SelectBoxState;
            }
        }
    }
}

- (void) mouseMoveTo:(NSPoint)pos withButtons:(MouseButton)buttons andMask:(InputMask)mask {
    if (!(buttons & LeftButton))
        return;

    Transformer *transformer = [renderer transformer];

    if (state == ToggleSelectState) {
        state = MoveSelectedNodesState;
        oldLeaderPos = [leaderNode point];
        [[self doc] startShiftNodes:[[[self doc] pickSupport] selectedNodes]];
    }

    if (state == SelectBoxState) {
        [self setSelectionBox:NSRectAroundPoints(dragOrigin, pos)];

        NSEnumerator *enumerator = [[self doc] nodeEnumerator];
        Node *node;
        while ((node = [enumerator nextObject]) != nil) {
            NSPoint nodePos = [transformer toScreen:[node point]];
            if (NSPointInRect(nodePos, selectionBox)) {
                [renderer setNode:node highlighted:YES];
            } else {
                [renderer setNode:node highlighted:NO];
            }
        }
    } else if (state == MoveSelectedNodesState) {
        if (leaderNode != nil) {
            [self shiftNodesByMovingLeader:leaderNode to:pos];
            NSPoint shiftSoFar;
            shiftSoFar.x = [leaderNode point].x - oldLeaderPos.x;
            shiftSoFar.y = [leaderNode point].y - oldLeaderPos.y;
            [[self doc] shiftNodesUpdate:shiftSoFar];
        }
    } else if (state == DragEdgeControlPoint1 || state == DragEdgeControlPoint2) {
        // invalidate once before we start changing it: we may be shrinking
        // the control circles
        [[self doc] modifyEdgeCheckPoint];
        if (state == DragEdgeControlPoint1) {
            [modifyEdge moveCp1To:[transformer fromScreen:pos]
                        withWeightCourseness:0.1f
                        andBendCourseness:15
                        forceLinkControlPoints:(mask & ControlMask)];
        } else {
            [modifyEdge moveCp2To:[transformer fromScreen:pos]
                        withWeightCourseness:0.1f
                        andBendCourseness:15
                        forceLinkControlPoints:(mask & ControlMask)];
        }
        [[self doc] modifyEdgeCheckPoint];
    }
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    if (state == SelectBoxState) {
        PickSupport *ps = [[self doc] pickSupport];
        Transformer *transformer = [renderer transformer];

        if (!(mask & unionSelectMask)) {
            [ps deselectAllNodes];
            [ps deselectAllEdges];
        }

        Graph *graph = [[self doc] graph];
        if (dragSelectMode & DragSelectsNodes) {
            for (Node *node in [graph nodes]) {
                NSPoint nodePos = [transformer toScreen:[node point]];
                if (NSPointInRect(nodePos, selectionBox)) {
                    [ps selectNode:node];
                }
            }
        }
        if (dragSelectMode & DragSelectsEdges) {
            for (Edge *edge in [graph edges]) {
                NSPoint edgePos = [transformer toScreen:[edge mid]];
                if (NSPointInRect(edgePos, selectionBox)) {
                    [ps selectEdge:edge];
                }
            }
        }

        [self clearSelectionBox];
    } else if (state == ToggleSelectState) {
        [[[self doc] pickSupport] deselectNode:leaderNode];
        leaderNode = nil;
    } else if (state == MoveSelectedNodesState) {
        if (NSEqualPoints (oldLeaderPos, [leaderNode point])) {
            [[self doc] cancelShiftNodes];
        } else {
            [[self doc] endShiftNodes];
        }
        leaderNode = nil;
    } else if (state == DragEdgeControlPoint1 || state == DragEdgeControlPoint2) {
        // FIXME: check if there was any real change
        [[self doc] endModifyEdge];
    }
}

- (void) mouseDoubleClickAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    if (state != QuietState) {
        return;
    }
    // convert bend mode on edge under mouse cursor
    Edge *edge = [renderer anyEdgeAt:pos withFuzz:edgeFuzz];
    if (edge != nil) {
        [[self doc] startModifyEdge:edge];
        if ([edge bendMode]==EdgeBendModeBasic) {
            [edge convertBendToAngles];
            [edge setBendMode:EdgeBendModeInOut];
        } else {
            [edge setBendMode:EdgeBendModeBasic];
        }
        [[self doc] endModifyEdge];

        [self deselectAllEdges];
        [[[self doc] pickSupport] selectEdge:edge];
    }
}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {
    if (!NSIsEmptyRect (selectionBox)) {
        [context saveState];

        [context setAntialiasMode:AntialiasDisabled];
        [context setLineWidth:1.0];
        [context startPath];
        [context rect:selectionBox];
        RColor fColor = MakeRColor (0.8, 0.8, 0.8, 0.2);
        RColor sColor = MakeSolidRColor (0.6, 0.6, 0.6);
        [context strokePathWithColor:sColor andFillWithColor:fColor];

        [context restoreState];
    }
}

- (void) loadConfiguration:(Configuration*)config {
    NSString *mode = [config stringEntry:@"Drag select mode"
                                 inGroup:@"SelectTool"];
    if ([mode isEqualToString:@"nodes"]) {
        [self setDragSelectMode:DragSelectsNodes];
    } else if ([mode isEqualToString:@"edges"]) {
        [self setDragSelectMode:DragSelectsEdges];
    } else if ([mode isEqualToString:@"both"]) {
        [self setDragSelectMode:DragSelectsBoth];
    }
}

- (void) saveConfiguration:(Configuration*)config {
    switch (dragSelectMode) {
        case DragSelectsNodes:
            [config setStringEntry:@"Drag select mode"
                           inGroup:@"SelectTool"
                             value:@"nodes"];
            break;
        case DragSelectsEdges:
            [config setStringEntry:@"Drag select mode"
                           inGroup:@"SelectTool"
                             value:@"edges"];
            break;
        case DragSelectsBoth:
            [config setStringEntry:@"Drag select mode"
                           inGroup:@"SelectTool"
                             value:@"both"];
            break;
    }
}

@end

@implementation SelectTool (Private)
- (TikzDocument*) doc {
    return [renderer document];
}

- (void) shiftNodesByMovingLeader:(Node*)leader to:(NSPoint)to {
    Transformer *transformer = [renderer transformer];

    NSPoint from = [transformer toScreen:[leader point]];
    //to = [[renderer grid] snapScreenPoint:to];
    float dx = to.x - from.x;
    float dy = to.y - from.y;

    for (Node *node in [[[self doc] pickSupport] selectedNodes]) {
        NSPoint p = [transformer toScreen:[node point]];
        p.x += dx;
        p.y += dy;
        p = [[renderer grid] snapScreenPoint:p];
        [node setPoint:[transformer fromScreen:p]];
    }
}

- (void) deselectAllNodes {
    [[[self doc] pickSupport] deselectAllNodes];
}

- (void) deselectAllEdges {
    [[[self doc] pickSupport] deselectAllEdges];
}

- (void) deselectAll {
    [[[self doc] pickSupport] deselectAllNodes];
    [[[self doc] pickSupport] deselectAllEdges];
}

- (BOOL) circleWithCenter:(NSPoint)c andRadius:(float)r containsPoint:(NSPoint)p {
    return (NSDistanceBetweenPoints(c, p) <= r);
}

- (void) lookForControlPointAt:(NSPoint)pos {
    const float cpr = [Edge controlPointRadius];
    for (Edge *e in [[[self doc] pickSupport] selectedEdges]) {
        NSPoint cp1 = [[renderer transformer] toScreen:[e cp1]];
        if ([self circleWithCenter:cp1 andRadius:cpr containsPoint:pos]) {
            state = DragEdgeControlPoint1;
            modifyEdge = e;
            [[self doc] startModifyEdge:e];
            return;
        }
        NSPoint cp2 = [[renderer transformer] toScreen:[e cp2]];
        if ([self circleWithCenter:cp2 andRadius:cpr containsPoint:pos]) {
            state = DragEdgeControlPoint2;
            modifyEdge = e;
            [[self doc] startModifyEdge:e];
            return;
        }
    }
}

- (void) setSelectionBox:(NSRect)box {
    NSRect invRect = NSUnionRect (selectionBox, box);
    selectionBox = box;
    [renderer invalidateRect:NSInsetRect (invRect, -2, -2)];
}

- (void) clearSelectionBox {
    NSRect oldRect = selectionBox;

    NSRect emptyRect;
    selectionBox = emptyRect;

    [renderer invalidateRect:NSInsetRect (oldRect, -2, -2)];
    [renderer clearHighlightedNodes];
}

- (BOOL) selectionBoxContainsNode:(Node*)node {
    if (!NSIsEmptyRect (selectionBox))
        return NO;

    Transformer *transf = [[renderer surface] transformer];
    NSPoint screenPt = [transf toScreen:[node point]];
    return NSPointInRect(screenPt, selectionBox);
}
@end

static void drag_select_mode_cb (GtkToggleButton *button, SelectTool *tool) {
    if (gtk_toggle_button_get_active (button)) {
        NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
        DragSelectMode buttonMode =
            (DragSelectMode) g_object_get_data (
                    G_OBJECT (button),
                    DRAG_SELECT_MODE_KEY);
        [tool setDragSelectMode:buttonMode];
        [pool drain];
    }
}

// vim:ft=objc:ts=8:et:sts=4:sw=4
