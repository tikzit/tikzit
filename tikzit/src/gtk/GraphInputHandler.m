/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
 * Copyright 2010  Chris Heunen
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

#import "GraphInputHandler.h"
#import <gdk/gdkkeysyms.h>
#import "Edge+Render.h"

static const InputMask unionSelectMask = ShiftMask;

@implementation GraphInputHandler
- (id) initWithGraphRenderer:(GraphRenderer*)r {
    self = [super init];

    if (self) {
        renderer = r;
        mode = SelectMode;
        state = QuietState;
        edgeFuzz = 3.0f;
        leaderNode = nil;
        modifyEdge = nil;
        selectionBoxContents = [[NSMutableSet alloc] initWithCapacity:10];
        currentResizeHandle = NoHandle;
    }

    return self;
}

- (TikzDocument*) doc {
    return [renderer document];
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

- (float) edgeFuzz {
    return edgeFuzz;
}

- (void) setEdgeFuzz:(float)fuzz {
    edgeFuzz = fuzz;
}

- (InputMode) mode {
    return mode;
}

- (void) resetState {
    state = QuietState;
}

- (void) setMode:(InputMode)m {
    if (mode != m) {
        if (mode == BoundingBoxMode) {
            [renderer setBoundingBoxHandlesShown:NO];
            [[renderer surface] setCursor:NormalCursor];
        }
        mode = m;
        [self deselectAll];
        if (m == BoundingBoxMode) {
            [renderer setBoundingBoxHandlesShown:YES];
        }
    }
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

- (void) mousePressAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    dragOrigin = pos;

    // we should already be in a quiet state, but no harm in making sure
    state = QuietState;

    if (mode == HandMode || mask == ControlMask) {
        state = CanvasDragState;
        oldOrigin = [[renderer transformer] origin];
    } else if (mode == DrawEdgeMode) {
        leaderNode = [renderer anyNodeAt:pos];
        if (leaderNode != nil) {
            state = EdgeDragState;
        }
    } else if (mode == BoundingBoxMode) {
        state = BoundingBoxState;
        currentResizeHandle = [renderer boundingBoxResizeHandleAt:pos];
        [[self doc] startChangeBoundingBox];
        if (currentResizeHandle == NoHandle) {
            [[[self doc] graph] setBoundingBox:NSZeroRect];
            [renderer setBoundingBoxHandlesShown:NO];
        }
    } else if (mode == SelectMode) {
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
}

- (void) mouseReleaseAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (state == SelectBoxState) {
        BOOL shouldDeselect = !(mask & unionSelectMask);
        if (shouldDeselect) {
            [self deselectAllEdges];
        }
        [[[self doc] pickSupport] selectAllNodes:selectionBoxContents
                                  replacingSelection:shouldDeselect];
        [renderer clearSelectionBox];
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
    } else if (state == EdgeDragState) {
        [renderer clearHalfEdge];
        Node *targ = [renderer anyNodeAt:pos];
        if (targ != nil) {
            [[self doc] addEdgeFrom:leaderNode to:targ];
        }
    } else if (state == QuietState && mode == CreateNodeMode) {
        Transformer *transformer = [renderer transformer];
        NSPoint nodePoint = [transformer fromScreen:[[renderer grid] snapScreenPoint:pos]];
        [[self doc] addNodeAt:nodePoint];
    } else if (state == BoundingBoxState) {
        [[self doc] endChangeBoundingBox];
        [renderer setBoundingBoxHandlesShown:YES];
    }

    state = QuietState;
}

- (void) mouseDoubleClickAt:(NSPoint)pos withButton:(MouseButton)button andMask:(InputMask)mask {
    if (mode != SelectMode) {
        return;
    }
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
    Transformer *transformer = [renderer transformer];

    if (state == ToggleSelectState) {
        state = MoveSelectedNodesState;
        oldLeaderPos = [leaderNode point];
        [[self doc] startShiftNodes:[[[self doc] pickSupport] selectedNodes]];
    }

    if (state == SelectBoxState) {
        NSRect selectionBox = NSRectAroundPoints(dragOrigin, pos);
        [renderer setSelectionBox:selectionBox];

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
    } else if (state == EdgeDragState) {
        [renderer setHalfEdgeFrom:leaderNode to:pos];
    } else if (state == BoundingBoxState) {
        Grid *grid = [renderer grid];
        Graph *graph = [[self doc] graph];
        if (currentResizeHandle == NoHandle) {
            NSRect bbox = NSRectAroundPoints(
                [grid snapScreenPoint:dragOrigin],
                [grid snapScreenPoint:pos]
            );
            [graph setBoundingBox:[transformer rectFromScreen:bbox]];
        } else {
            NSRect bbox = [transformer rectToScreen:[graph boundingBox]];
            NSPoint p2 = [grid snapScreenPoint:pos];

            if (currentResizeHandle == NorthWestHandle ||
                    currentResizeHandle == NorthHandle ||
                    currentResizeHandle == NorthEastHandle) {

                    float dy = p2.y - NSMinY(bbox);
                    if (dy < bbox.size.height) {
                        bbox.origin.y += dy;
                        bbox.size.height -= dy;
                    } else {
                        bbox.origin.y = NSMaxY(bbox);
                        bbox.size.height = 0;
                    }

            } else if (currentResizeHandle == SouthWestHandle ||
                    currentResizeHandle == SouthHandle ||
                    currentResizeHandle == SouthEastHandle) {

                    float dy = p2.y - NSMaxY(bbox);
                    if (-dy < bbox.size.height) {
                        bbox.size.height += dy;
                    } else {
                        bbox.size.height = 0;
                    }
            }

            if (currentResizeHandle == NorthWestHandle ||
                    currentResizeHandle == WestHandle ||
                    currentResizeHandle == SouthWestHandle) {

                    float dx = p2.x - NSMinX(bbox);
                    if (dx < bbox.size.width) {
                        bbox.origin.x += dx;
                        bbox.size.width -= dx;
                    } else {
                        bbox.origin.x = NSMaxX(bbox);
                        bbox.size.width = 0;
                    }

            } else if (currentResizeHandle == NorthEastHandle ||
                    currentResizeHandle == EastHandle ||
                    currentResizeHandle == SouthEastHandle) {

                    float dx = p2.x - NSMaxX(bbox);
                    if (-dx < bbox.size.width) {
                        bbox.size.width += dx;
                    } else {
                        bbox.size.width = 0;
                    }
            }
            [graph setBoundingBox:[transformer rectFromScreen:bbox]];
        }
        [[self doc] changeBoundingBoxCheckPoint];
    } else if (state == CanvasDragState) {
        NSPoint newOrigin = oldOrigin;
        newOrigin.x += pos.x - dragOrigin.x;
        newOrigin.y += pos.y - dragOrigin.y;
        [[renderer transformer] setOrigin:newOrigin];
        [renderer invalidateGraph];
    }
    if (mode == BoundingBoxMode && state != BoundingBoxState) {
        ResizeHandle handle = [renderer boundingBoxResizeHandleAt:pos];
        if (handle != currentResizeHandle) {
            currentResizeHandle = handle;
            Cursor c = NormalCursor;
            switch (handle) {
                case EastHandle:
                    c = ResizeRightCursor;
                    break;
                case SouthEastHandle:
                    c = ResizeBottomRightCursor;
                    break;
                case SouthHandle:
                    c = ResizeBottomCursor;
                    break;
                case SouthWestHandle:
                    c = ResizeBottomLeftCursor;
                    break;
                case WestHandle:
                    c = ResizeLeftCursor;
                    break;
                case NorthWestHandle:
                    c = ResizeTopLeftCursor;
                    break;
                case NorthHandle:
                    c = ResizeTopCursor;
                    break;
                case NorthEastHandle:
                    c = ResizeTopRightCursor;
                    break;
                default:
                    c = NormalCursor;
                    break;
            }
            [[renderer surface] setCursor:c];
        }
    }
}

- (void) mouseScrolledAt:(NSPoint)pos inDirection:(ScrollDirection)dir withMask:(InputMask)mask {
    if (mask == ControlMask) {
        if (dir == ScrollUp) {
            [[renderer surface] zoomInAboutPoint:pos];
        } else if (dir == ScrollDown) {
            [[renderer surface] zoomOutAboutPoint:pos];
        }
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
