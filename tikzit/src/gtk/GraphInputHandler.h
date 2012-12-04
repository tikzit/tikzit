/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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

#import "TZFoundation.h"
#import "GraphRenderer.h"
#import "InputDelegate.h"
#import "StyleManager.h"

typedef enum {
    SelectMode,
    CreateNodeMode,
    DrawEdgeMode,
    BoundingBoxMode,
    HandMode
} InputMode;

typedef enum {
    QuietState,
    SelectBoxState,
    ToggleSelectState,
    MoveSelectedNodesState,
    DragEdgeControlPoint1,
    DragEdgeControlPoint2,
    EdgeDragState,
    BoundingBoxState,
    CanvasDragState
} MouseState;

@interface GraphInputHandler: NSObject <InputDelegate> {
    GraphRenderer *renderer;
    InputMode      mode;
    MouseState     state;
    float          edgeFuzz;
    NSPoint        dragOrigin;
    Node          *leaderNode;
    NSPoint        oldLeaderPos;
    Edge          *modifyEdge;
    NSMutableSet  *selectionBoxContents;
    ResizeHandle   currentResizeHandle;
    NSPoint        oldOrigin;
}

@property (assign) float edgeFuzz;
@property (assign) InputMode mode;

- (id) initWithGraphRenderer:(GraphRenderer*)r;

- (void) resetState;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
