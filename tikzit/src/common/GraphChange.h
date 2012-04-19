//
//  GraphChange.h
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

#import "Node.h"
#import "Edge.h"

typedef enum {
	GraphAddition,
	GraphDeletion,
	NodePropertyChange,
	EdgePropertyChange,
	NodesPropertyChange,
	EdgesPropertyChange,
	NodesShift,
	NodesFlip,
	EdgesReverse,
	BoundingBoxChange,
	GraphPropertyChange,
	NodeOrderChange,
	EdgeOrderChange
} ChangeType;

/*!
 @class      GraphChange 
 @brief      Store the data associated with a graph change.
 @details    All of the methods that change a graph return an object of type GraphChange.
             Graph changes can be re-done by calling [graph applyGraphChange:]. They can be undone
             by calling applyGraphChange on [change inverse]. This class has no public initializer,
             so everything should be constructed by factory methods.
 */
@interface GraphChange : NSObject {
	ChangeType changeType;
	
	// for addition, deletion, and shifts
	NSSet *affectedNodes;
	NSSet *affectedEdges;
	NSPoint shiftPoint;
	
	// for flip
	BOOL horizontal;
	
	// for property changes
	Node *nodeRef;
	Edge *edgeRef;

	Node *oldNode, *nwNode;
	Edge *oldEdge, *nwEdge;
	NSMapTable *oldNodeTable, *nwNodeTable;
	NSMapTable *oldEdgeTable, *nwEdgeTable;
	NSRect oldBoundingBox, nwBoundingBox;
	GraphElementData *oldGraphData, *nwGraphData;

	NSArray *oldNodeOrder, *newNodeOrder;
	NSArray *oldEdgeOrder, *newEdgeOrder;
}

/*!
 @property   changeType
 @brief      Type of GraphChange.
 */
@property (assign) ChangeType changeType;

/*!
 @property   shiftPoint
 @brief      A point storing a shifted distance.
 */
@property (assign) NSPoint shiftPoint;

/*!
 @property   horizontal
 @brief      Flags whether nodes were flipped horizontally
 */
@property (assign) BOOL horizontal;

/*!
 @property   affectedNodes
 @brief      A set of nodes affected by this change, may be undefined.
 */
@property (copy) NSSet *affectedNodes;

/*!
 @property   affectedEdges
 @brief      A set of edges affected by this change, may be undefined.
 */
@property (copy) NSSet *affectedEdges;

/*!
 @property   nodeRef
 @brief      A reference to a single node affected by this change, may be undefined.
 */
@property (retain) Node *nodeRef;

/*!
 @property   oldNode
 @brief      A copy of the node pre-change.
 */
@property (copy) Node *oldNode;

/*!
 @property   nwNode
 @brief      A copy of the node post-change.
 */
@property (copy) Node *nwNode;

/*!
 @property   edgeRef
 @brief      A reference to a single edge affected by this change, may be undefined.
 */
@property (retain) Edge *edgeRef;

/*!
 @property   oldEdge
 @brief      A copy of the edge pre-change.
 */
@property (copy) Edge *oldEdge;

/*!
 @property   nwEdge
 @brief      A copy of the edge post-change.
 */
@property (copy) Edge *nwEdge;

/*!
 @property   oldNodeTable
 @brief      A a table containing copies of a set of nodes pre-change.
 */
@property (retain) NSMapTable *oldNodeTable;

/*!
 @property   nwNodeTable
 @brief      A a table containing copies of a set of nodes post-change.
 */
@property (retain) NSMapTable *nwNodeTable;

/*!
 @property   oldEdgeTable
 @brief      A a table containing copies of a set of edges pre-change.
 */
@property (retain) NSMapTable *oldEdgeTable;

/*!
 @property   nwEdgeTable
 @brief      A a table containing copies of a set of edges post-change.
 */
@property (retain) NSMapTable *nwEdgeTable;

/*!
 @property   oldBoundingBox
 @brief      The old bounding box.
 */
@property (assign) NSRect oldBoundingBox;

/*!
 @property   nwBoundingBox
 @brief      The new bounding box.
 */
@property (assign) NSRect nwBoundingBox;

/*!
 @property   oldGraphData
 @brief      The old graph data.
 */
@property (copy) GraphElementData *oldGraphData;

/*!
 @property   nwGraphData
 @brief      The new graph data.
 */
@property (copy) GraphElementData *nwGraphData;

/*!
 @property   oldNodeOrder
 @brief      The old node list.
 */
@property (copy) NSArray *oldNodeOrder;

/*!
 @property   newNodeOrder
 @brief      The new node list.
 */
@property (copy) NSArray *newNodeOrder;

/*!
 @property   oldEdgeOrder
 @brief      The old edge list.
 */
@property (copy) NSArray *oldEdgeOrder;

/*!
 @property   newEdgeOrder
 @brief      The new edge list.
 */
@property (copy) NSArray *newEdgeOrder;

/*!
 @brief      Invert a GraphChange.
 @details    Invert a GraphChange. Calling [graph applyGraphChange:[[graph msg:...] invert]]
             should leave the graph unchanged for any method of Graph that returns a
             GraphChange.
 @result     The inverse of the current Graph Change.
 */
- (GraphChange*)invert;

/*!
 @brief      Construct a graph addition. affectedNodes are the added nodes,
             affectedEdges are the added edges.
 @param      ns a set of nodes.
 @param      es a set of edges.
 @result     A graph addition.
 */
+ (GraphChange*)graphAdditionWithNodes:(NSSet*)ns edges:(NSSet*)es;

/*!
 @brief      Construct a graph deletion. affectedNodes are the deleted nodes,
             affectedEdges are the deleted edges.
 @param      ns a set of nodes.
 @param      es a set of edges.
 @result     A graph deletion.
 */
+ (GraphChange*)graphDeletionWithNodes:(NSSet*)ns edges:(NSSet*)es;

/*!
 @brief      Construct a property change of a single node.
 @param      nd the affected node.
 @param      old a copy of the node pre-change
 @param      nw a copy of the node post-change
 @result     A property change of a single node.
 */
+ (GraphChange*)propertyChangeOfNode:(Node*)nd fromOld:(Node*)old toNew:(Node*)nw;

/*!
 @brief      Construct a property change of a single edge.
 @param      e the affected edge.
 @param      old a copy of the edge pre-change
 @param      nw a copy of the edge post-change
 @result     A property change of a single node.
 */
+ (GraphChange*)propertyChangeOfEdge:(Edge*)e fromOld:(Edge *)old toNew:(Edge *)nw;

/*!
 @brief      Construct a property change of set of nodes.
 @details    Construct a property change of set of nodes. oldC and newC should be
             constructed using the class method [Graph nodeTableForNodes:] before
             and after the property change, respectively. The affected nodes are
             keys(oldC) = keys(newC).
 @param      oldC a table of copies of nodes pre-change
 @param      newC a table of copies of nodes post-change
 @result     A property change of a set of nodes.
 */
+ (GraphChange*)propertyChangeOfNodesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC;

/*!
 @brief      Construct a property change of set of edges.
 @details    Construct a property change of set of edges. oldC and newC should be
             constructed using the class method [Graph edgeTableForEdges:] before
             and after the property change, respectively. The affected edges are
             keys(oldC) = keys(newC).
 @param      oldC a table of copies of edges pre-change
 @param      newC a table of copies of edges post-change
 @result     A property change of a set of edges.
 */
+ (GraphChange*)propertyChangeOfEdgesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC;


/*!
 @brief      Construct a shift of a set of nodes by a given point.
 @param      ns the affected nodes.
 @param      p a point storing (dx,dy)
 @result     A shift of a set of nodes.
 */
+ (GraphChange*)shiftNodes:(NSSet*)ns byPoint:(NSPoint)p;

/*!
 @brief      Construct a horizontal or vertical flip of a set of nodes.
 @param      ns the affected nodes.
 @param      b flag for whether to flip horizontally
 @result     A flip of a set of nodes.
 */
+ (GraphChange*)flipNodes:(NSSet*)ns horizontal:(BOOL)b;

/*!
 @brief      Construct a reversal of a set of edges.
 @param      es the affected edges.
 @result     A reverse of a set of edges.
 */
+ (GraphChange*)reverseEdges:(NSSet*)es;

/*!
 @brief      Construct a bounding box change
 @param      oldBB the old bounding box
 @param      newBB the new bounding box
 @result     A bounding box change.
 */
+ (GraphChange*)changeBoundingBoxFrom:(NSRect)oldBB to:(NSRect)newBB;

/*!
 @brief      Construct a graph property change
 @param      oldData the old graph data
 @param      newData the new graph data
 @result     A graph property change.
 */
+ (GraphChange*)propertyChangeOfGraphFrom:(GraphElementData*)oldData to:(GraphElementData*)newData;

/*!
 @brief      Construct a node order change
 @param old  The old ordering
 @param new  The new ordering
 @result     A node order change
 */
+ (GraphChange*)nodeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected;

/*!
 @brief      Construct an edge order change
 @param old  The old ordering
 @param new  The new ordering
 @result     A edge order change
 */
+ (GraphChange*)edgeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
