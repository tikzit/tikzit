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

#import "TZFoundation.h"
#import "Tool.h"

@class Edge;
@class Node;

// FIXME: replace this with delegates
typedef enum {
    QuietState,
    SelectBoxState,
    ToggleSelectState,
    MoveSelectedNodesState,
    DragEdgeControlPoint1,
    DragEdgeControlPoint2
} SelectToolState;

typedef enum {
    DragSelectsNodes = 1,
    DragSelectsEdges = 2,
    DragSelectsBoth = DragSelectsNodes | DragSelectsEdges
} DragSelectMode;

@interface SelectTool : NSObject <Tool> {
    GraphRenderer      *renderer;
    SelectToolState     state;
    float               edgeFuzz;
    DragSelectMode      dragSelectMode;
    NSPoint             dragOrigin;
    Node               *leaderNode;
    NSPoint             oldLeaderPos;
    Edge               *modifyEdge;
    NSRect              selectionBox;
    NSMutableSet       *selectionBoxContents;

    GtkWidget          *configWidget;
    GSList             *dragSelectModeButtons;
}

@property (assign) float edgeFuzz;
@property (assign) DragSelectMode dragSelectMode;

- (id) init;
+ (id) tool;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
