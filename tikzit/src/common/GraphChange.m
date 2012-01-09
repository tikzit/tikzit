//
//  GraphChange.m
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


// GraphChange : store the data associated to a single, undo-able change
// to a graph. An undo manager should maintain a stack of such changes
// and undo/redo them on request using [graph applyGraphChange:...].

#import "GraphChange.h"


@implementation GraphChange

- (id)init {
	[super init];
	return self;
}

- (ChangeType)changeType { return changeType; }

- (void)setChangeType:(ChangeType)ct {
	changeType = ct;
}

- (BOOL)horizontal { return horizontal; }
- (void)setHorizontal:(BOOL)b {
	horizontal = b;
}

- (NSPoint)shiftPoint { return shiftPoint; }
- (void)setShiftPoint:(NSPoint)p {
	shiftPoint = p;
}

- (NSSet*)affectedNodes { return affectedNodes; }

- (void)setAffectedNodes:(NSSet*)set {
	if (affectedNodes != set) {
		[affectedNodes release];
		affectedNodes = [[NSSet alloc] initWithSet:set];
	}
}

- (NSSet*)affectedEdges { return affectedEdges; }

- (void)setAffectedEdges:(NSSet*)set {
	if (affectedEdges != set) {
		[affectedEdges release];
		affectedEdges = [[NSSet alloc] initWithSet:set];
	}
}

- (Node*)nodeRef { return nodeRef; }

- (void)setNodeRef:(Node*)nd {
	if (nodeRef != nd) {
		[nodeRef release];
		nodeRef = [nd retain];
	}
}

- (Node*)oldNode { return oldNode; }

- (void)setOldNode:(Node*)nd {
	if (oldNode != nd) {
		[oldNode release];
		oldNode = [nd copy];
	}
}

- (Node*)nwNode { return nwNode; }

- (void)setNwNode:(Node*)nd {
	if (nwNode != nd) {
		[nwNode release];
		nwNode = [nd copy];
	}
}

- (Edge*)edgeRef { return edgeRef; }

- (void)setEdgeRef:(Edge*)ed {
	if (edgeRef != ed) {
		[edgeRef release];
		edgeRef = [ed retain];
	}
}

- (Edge*)oldEdge { return oldEdge; }

- (void)setOldEdge:(Edge*)ed {
	if (oldEdge != ed) {
		[oldEdge release];
		oldEdge = [ed copy];
	}
}

- (Edge*)nwEdge { return nwEdge; }

- (void)setNwEdge:(Edge*)ed {
	if (nwEdge != ed) {
		[nwEdge release];
		nwEdge = [ed copy];
	}
}

- (BasicMapTable*)oldNodeTable { return oldNodeTable; }

- (void)setOldNodeTable:(BasicMapTable*)tab {
	if (oldNodeTable != tab) {
		[oldNodeTable release];
		oldNodeTable = [tab retain];
	}
}

- (BasicMapTable*)nwNodeTable { return nwNodeTable; }

- (void)setNwNodeTable:(BasicMapTable*)tab {
	if (nwNodeTable != tab) {
		[nwNodeTable release];
		nwNodeTable = [tab retain];
	}
}

- (NSRect)oldBoundingBox { return oldBoundingBox; }

- (void)setOldBoundingBox:(NSRect)bbox {
	oldBoundingBox = bbox;
}

- (NSRect)nwBoundingBox { return nwBoundingBox; }

- (void)setNwBoundingBox:(NSRect)bbox {
	nwBoundingBox = bbox;
}

- (GraphElementData*)oldGraphData {
	return oldGraphData;
}

- (void)setOldGraphData:(GraphElementData*)data {
	id origOGD = oldGraphData;
	oldGraphData = [data copy];
	[origOGD release];
}

- (GraphElementData*)nwGraphData {
	return nwGraphData;
}

- (void)setNwGraphData:(GraphElementData*)data {
	id origNGD = nwGraphData;
	nwGraphData = [data copy];
	[origNGD release];
}

- (GraphChange*)invert {
	GraphChange *inverse = [[GraphChange alloc] init];
	switch ([self changeType]) {
		case GraphAddition:
			[inverse setChangeType:GraphDeletion];
			[inverse setAffectedNodes:[self affectedNodes]];
			[inverse setAffectedEdges:[self affectedEdges]];
			break;
		case GraphDeletion:
			[inverse setChangeType:GraphAddition];
			[inverse setAffectedNodes:[self affectedNodes]];
			[inverse setAffectedEdges:[self affectedEdges]];
			break;
		case NodePropertyChange:
			[inverse setChangeType:NodePropertyChange];
			[inverse setNodeRef:[self nodeRef]];
			[inverse setOldNode:[self nwNode]];
			[inverse setNwNode:[self oldNode]];
			break;
		case NodesPropertyChange:
			[inverse setChangeType:NodesPropertyChange];
			[inverse setOldNodeTable:[self nwNodeTable]];
			[inverse setNwNodeTable:[self oldNodeTable]];
			break;
		case EdgePropertyChange:
			[inverse setChangeType:EdgePropertyChange];
			[inverse setEdgeRef:[self edgeRef]];
			[inverse setOldEdge:[self nwEdge]];
			[inverse setNwEdge:[self oldEdge]];
			break;
		case NodesShift:
			[inverse setChangeType:NodesShift];
			[inverse setAffectedNodes:[self affectedNodes]];
			[inverse setShiftPoint:NSMakePoint(-[self shiftPoint].x,
											   -[self shiftPoint].y)];
			break;
		case NodesFlip:
			[inverse setChangeType:NodesFlip];
			[inverse setAffectedNodes:[self affectedNodes]];
			[inverse setHorizontal:[self horizontal]];
			break;
		case BoundingBoxChange:
			[inverse setChangeType:BoundingBoxChange];
			[inverse setOldBoundingBox:[self nwBoundingBox]];
			[inverse setNwBoundingBox:[self oldBoundingBox]];
			break;
		case GraphPropertyChange:
			[inverse setChangeType:GraphPropertyChange];
			[inverse setOldGraphData:[self nwGraphData]];
			[inverse setNwGraphData:[self oldGraphData]];
			break;
	}
	
	return [inverse autorelease];
}

- (void)dealloc {
	[affectedNodes release];
	[affectedEdges release];
	[nodeRef release];
	[oldNode release];
	[nwNode release];
	[edgeRef release];	
	[oldEdge release];
	[oldNodeTable release];
	[nwNodeTable release];
	
	[super dealloc];
}

+ (GraphChange*)graphAdditionWithNodes:(NSSet *)ns edges:(NSSet *)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphAddition];
	[gc setAffectedNodes:ns];
	[gc setAffectedEdges:es];
	return [gc autorelease];
}

+ (GraphChange*)graphDeletionWithNodes:(NSSet *)ns edges:(NSSet *)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphDeletion];
	[gc setAffectedNodes:ns];
	[gc setAffectedEdges:es];
	return [gc autorelease];
}

+ (GraphChange*)propertyChangeOfNode:(Node*)nd fromOld:(Node*)old toNew:(Node*)nw {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodePropertyChange];
	[gc setNodeRef:nd];
	[gc setOldNode:old];
	[gc setNwNode:nw];
	return [gc autorelease];
}

+ (GraphChange*)propertyChangeOfNodesFromOldCopies:(BasicMapTable*)oldC
									   toNewCopies:(BasicMapTable*)newC {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesPropertyChange];
	[gc setOldNodeTable:oldC];
	[gc setNwNodeTable:newC];
	return [gc autorelease];
}

+ (GraphChange*)propertyChangeOfEdge:(Edge*)e fromOld:(Edge *)old toNew:(Edge *)nw {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgePropertyChange];
	[gc setEdgeRef:e];
	[gc setOldEdge:old];
	[gc setNwEdge:nw];
	return [gc autorelease];
}

+ (GraphChange*)shiftNodes:(NSSet*)ns byPoint:(NSPoint)p {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesShift];
	[gc setAffectedNodes:ns];
	[gc setShiftPoint:p];
	return [gc autorelease];
}

+ (GraphChange*)flipNodes:(NSSet*)ns horizontal:(BOOL)b {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesFlip];
	[gc setAffectedNodes:ns];
	[gc setHorizontal:b];
	return [gc autorelease];
}

+ (GraphChange*)changeBoundingBoxFrom:(NSRect)oldBB to:(NSRect)newBB {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:BoundingBoxChange];
	[gc setOldBoundingBox:oldBB];
	[gc setNwBoundingBox:newBB];
	return [gc autorelease];
}

+ (GraphChange*)propertyChangeOfGraphFrom:(GraphElementData*)oldData to:(GraphElementData*)newData {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphPropertyChange];
	[gc setOldGraphData:oldData];
	[gc setNwGraphData:newData];
	return [gc autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
