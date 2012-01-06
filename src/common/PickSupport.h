//
//  PickSupport.h
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  


#import <Foundation/Foundation.h>
#import "Node.h"
#import "Edge.h"

/*!
 @class      PickSupport
 @brief      Maintain the selection state of nodes and edges.
 @detail     In addition to the notifications listed for specific methods,
             whenever the node selection changes, a "NodeSelectionChanged"
             signal is emitted, and whenever the edge selection changes,
             an "EdgeSelectionChanged" signal is emitted.
 */
@interface PickSupport : NSObject {
	NSMutableSet *selectedNodes;
	NSMutableSet *selectedEdges;
}

/*!
 @property   selectedNodes
 @brief      A set of selected nodes.
 */
@property (readonly) NSSet *selectedNodes;

/*!
 @property   selectedEdges
 @brief      A set of selected edges.
 */
@property (readonly) NSSet *selectedEdges;

/*!
 @brief      Check if a node is selected.
 @param      nd a node.
 @result     YES if nd is selected.
 */
- (BOOL)isNodeSelected:(Node*)nd;

/*!
 @brief      Check if an edge is selected.
 @param      e an edge.
 @result     YES if e is selected.
 */
- (BOOL)isEdgeSelected:(Edge*)e;

/*!
 @brief      Select a node.
 @details    Sends the "NodeSelected" notification if the node was not
             already selected, with @p nd as "node" in the userInfo
 @param      nd a node.
 */
- (void)selectNode:(Node*)nd;

/*!
 @brief      Deselect a node.
 @details    Sends the "NodeDeselected" notification if the node was
             selected, with @p nd as "node" in the userInfo
 @param      nd a node.
 */
- (void)deselectNode:(Node*)nd;

/*!
 @brief      Select an edge.
 @details    Sends the "EdgeSelected" notification if the node was not
             already selected, with @p e as "edge" in the userInfo
 @param      e an edge.
 */
- (void)selectEdge:(Edge*)e;

/*!
 @brief      Deselect an edge.
 @details    Sends the "EdgeDeselected" notification if the node was
             selected, with @p e as "edge" in the userInfo
 @param      e an edge.
 */
- (void)deselectEdge:(Edge*)e;

/*!
 @brief      Toggle the selected state of the given node.
 @details    Sends the "NodeSelected" or "NodeDeselected" notification as
             appropriate, with @p nd as "node" in the userInfo
 @param      nd a node.
 */
- (void)toggleNodeSelected:(Node*)nd;

/*!
 @brief      Select all nodes in the given set.
 @details    Sends the "NodeSelectionReplaced" notification if this
             caused the selection to change.

             Equivalent to selectAllNodes:nodes replacingSelection:YES
 @param      nodes a set of nodes.
 */
- (void)selectAllNodes:(NSSet*)nodes;

/*!
 @brief      Select all nodes in the given set.
 @details    Sends the "NodeSelectionReplaced" notification if this
             caused the selection to change.

             If replace is NO, @p nodes will be added to the existing
             selection, otherwise it will replace the existing selection.
 @param      nodes a set of nodes.
 @param      replace whether to replace the existing selection
 */
- (void)selectAllNodes:(NSSet*)nodes replacingSelection:(BOOL)replace;

/*!
 @brief      Deselect all nodes.
 @details    Sends the "NodeSelectionReplaced" notification if there
             were any nodes previously selected
 */
- (void)deselectAllNodes;

/*!
 @brief      Deselect all edges.
 @details    Sends the "EdgeSelectionReplaced" notification if there
             were any edges previously selected
 */
- (void)deselectAllEdges;

/*!
 @brief      Factory method for getting a new <tt>PickSupport</tt> object.
 @result     An empty <tt>PickSupport</tt>.
 */
+ (PickSupport*)pickSupport;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
