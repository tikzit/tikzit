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
	return [super init];
}

- (void)dealloc {
	[affectedNodes release];
	[affectedEdges release];
	[nodeRef release];
	[edgeRef release];
	[oldNode release];
	[nwNode release];
	[oldEdge release];
	[nwEdge release];
	[oldNodeTable release];
	[nwNodeTable release];
	[oldEdgeTable release];
	[nwEdgeTable release];
	[oldGraphData release];
	[nwGraphData release];
	[oldNodeOrder release];
	[nwNodeOrder release];
	[oldEdgeOrder release];
	[nwEdgeOrder release];
	
	[super dealloc];
}

@synthesize changeType;
@synthesize shiftPoint, horizontal;
@synthesize affectedEdges, affectedNodes;
@synthesize edgeRef, nodeRef;
@synthesize nwNode, oldNode;
@synthesize nwEdge, oldEdge;
@synthesize oldNodeTable, nwNodeTable;
@synthesize oldEdgeTable, nwEdgeTable;
@synthesize oldBoundingBox, nwBoundingBox;
@synthesize oldGraphData, nwGraphData;
@synthesize oldNodeOrder, nwNodeOrder;
@synthesize oldEdgeOrder, nwEdgeOrder;

- (GraphChange*)invert {
	GraphChange *inverse = [[GraphChange alloc] init];
	[inverse setChangeType:[self changeType]];
	switch ([self changeType]) {
		case GraphAddition:
			[inverse setChangeType:GraphDeletion];
			inverse->affectedNodes = [affectedNodes retain];
			inverse->affectedEdges = [affectedEdges retain];
			break;
		case GraphDeletion:
			[inverse setChangeType:GraphAddition];
			inverse->affectedNodes = [affectedNodes retain];
			inverse->affectedEdges = [affectedEdges retain];
			break;
		case NodePropertyChange:
			inverse->nodeRef = [nodeRef retain];
			inverse->oldNode = [nwNode retain];
			inverse->nwNode = [oldNode retain];
			break;
		case NodesPropertyChange:
			inverse->oldNodeTable = [nwNodeTable retain];
			inverse->nwNodeTable = [oldNodeTable retain];
			break;
		case EdgePropertyChange:
			inverse->edgeRef = [edgeRef retain];
			inverse->oldEdge = [nwEdge retain];
			inverse->nwEdge = [oldEdge retain];
			break;
		case EdgesPropertyChange:
			inverse->oldEdgeTable = [nwEdgeTable retain];
			inverse->nwEdgeTable = [oldEdgeTable retain];
			break;
		case NodesShift:
			inverse->affectedNodes = [affectedNodes retain];
			[inverse setShiftPoint:NSMakePoint(-[self shiftPoint].x,
											   -[self shiftPoint].y)];
			break;
		case NodesFlip:
			inverse->affectedNodes = [affectedNodes retain];
			[inverse setHorizontal:[self horizontal]];
			break;
		case EdgesReverse:
			inverse->affectedEdges = [affectedEdges retain];
			break;
		case BoundingBoxChange:
			inverse->oldBoundingBox = nwBoundingBox;
			inverse->nwBoundingBox = oldBoundingBox;
			break;
		case GraphPropertyChange:
			inverse->oldGraphData = [nwGraphData retain];
			inverse->nwGraphData = [oldGraphData retain];
			break;
		case NodeOrderChange:
			inverse->affectedNodes = [affectedNodes retain];
			inverse->oldNodeOrder = [nwNodeOrder retain];
			inverse->nwNodeOrder = [oldNodeOrder retain];
			break;
		case EdgeOrderChange:
			inverse->affectedEdges = [affectedEdges retain];
			inverse->oldEdgeOrder = [nwEdgeOrder retain];
			inverse->nwEdgeOrder = [oldEdgeOrder retain];
			break;
	}

	return [inverse autorelease];
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

+ (GraphChange*)propertyChangeOfNodesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC {
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

+ (GraphChange*)propertyChangeOfEdgesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgesPropertyChange];
	[gc setOldEdgeTable:oldC];
	[gc setNwEdgeTable:newC];
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

+ (GraphChange*)reverseEdges:(NSSet*)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgesReverse];
	[gc setAffectedEdges:es];
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

+ (GraphChange*)nodeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodeOrderChange];
	[gc setAffectedNodes:affected];
	[gc setOldNodeOrder:old];
	[gc setNwNodeOrder:new];
	return [gc autorelease];
}

+ (GraphChange*)edgeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgeOrderChange];
	[gc setAffectedEdges:affected];
	[gc setOldEdgeOrder:old];
	[gc setNwEdgeOrder:new];
	return [gc autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
