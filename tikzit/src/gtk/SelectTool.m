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

#import "Edge+Render.h"
#import "GraphRenderer.h"
#import "TikzDocument.h"
#import "tzstockitems.h"

static const InputMask unionSelectMask = ShiftMask;

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
        selectionBoxContents = [[NSMutableSet alloc] initWithCapacity:10];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [renderer release];
    [leaderNode release];
    [modifyEdge release];
    [selectionBoxContents release];

    g_object_unref (G_OBJECT (configWidget));

    [super dealloc];
}

- (GraphRenderer*) activeRenderer { return renderer; }
- (void) setActiveRenderer:(GraphRenderer*)r {
    if (r == renderer)
        return;

    [self deselectAll];

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
                [self deselectAllEdges];
                [self deselectAllNodes];
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
                [selectionBoxContents removeAllObjects];
                state = SelectBoxState;
            }
        }
    }
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (button != LeftButton)
        return;

    if (state == SelectBoxState) {
        BOOL shouldDeselect = !(mask & unionSelectMask);
        if (shouldDeselect) {
            [self deselectAllEdges];
        }
        [[[self doc] pickSupport] selectAllNodes:selectionBoxContents
                                  replacingSelection:shouldDeselect];
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
                if (![selectionBoxContents member:node]) {
                    [selectionBoxContents addObject:node];
                    [renderer invalidateNode:node];
                }
            } else {
                if ([selectionBoxContents member:node]) {
                    [selectionBoxContents removeObject:node];
                    [renderer invalidateNode:node];
                }
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

- (void) loadConfiguration:(Configuration*)config {}
- (void) saveConfiguration:(Configuration*)config {}

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
}

- (BOOL) selectionBoxContainsNode:(Node*)node {
    if (!NSIsEmptyRect (selectionBox))
        return NO;

    Transformer *transf = [[renderer surface] transformer];
    NSPoint screenPt = [transf toScreen:[node point]];
    return NSPointInRect(screenPt, selectionBox);
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
