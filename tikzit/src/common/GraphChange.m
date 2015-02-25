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
#if ! __has_feature(objc_arc)
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
#endif
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
#if __has_feature(objc_arc)
            inverse->affectedNodes = affectedNodes;
            inverse->affectedEdges = affectedEdges;
#else
            inverse->affectedNodes = [affectedNodes retain];
            inverse->affectedEdges = [affectedEdges retain];
#endif
			break;
		case GraphDeletion:
			[inverse setChangeType:GraphAddition];
#if __has_feature(objc_arc)
            inverse->affectedNodes = affectedNodes;
            inverse->affectedEdges = affectedEdges;
#else
            inverse->affectedNodes = [affectedNodes retain];
            inverse->affectedEdges = [affectedEdges retain];
#endif
			break;
		case NodePropertyChange:
#if __has_feature(objc_arc)
            inverse->nodeRef = nodeRef;
            inverse->oldNode = nwNode;
            inverse->nwNode = oldNode;
#else
            inverse->nodeRef = [nodeRef retain];
            inverse->oldNode = [nwNode retain];
            inverse->nwNode = [oldNode retain];
#endif
			break;
		case NodesPropertyChange:
#if __has_feature(objc_arc)
            
#else
            inverse->oldNodeTable = [nwNodeTable retain];
            inverse->nwNodeTable = [oldNodeTable retain];
#endif
			break;
		case EdgePropertyChange:
#if __has_feature(objc_arc)
            inverse->edgeRef = edgeRef;
            inverse->oldEdge = nwEdge;
            inverse->nwEdge = oldEdge;
#else
            inverse->edgeRef = [edgeRef retain];
            inverse->oldEdge = [nwEdge retain];
            inverse->nwEdge = [oldEdge retain];
#endif
			break;
		case EdgesPropertyChange:
#if __has_feature(objc_arc)
            inverse->oldEdgeTable = nwEdgeTable;
            inverse->nwEdgeTable = oldEdgeTable;
#else
            inverse->oldEdgeTable = [nwEdgeTable retain];
            inverse->nwEdgeTable = [oldEdgeTable retain];
#endif
			break;
		case NodesShift:
#if __has_feature(objc_arc)
            inverse->affectedNodes = affectedNodes;
#else
            inverse->affectedNodes = [affectedNodes retain];
#endif
            [inverse setShiftPoint:NSMakePoint(-[self shiftPoint].x,
                                               -[self shiftPoint].y)];
			break;
		case NodesFlip:
#if __has_feature(objc_arc)
            inverse->affectedNodes = affectedNodes;
#else
            inverse->affectedNodes = [affectedNodes retain];
#endif
            [inverse setHorizontal:[self horizontal]];
			break;
		case EdgesReverse:
#if __has_feature(objc_arc)
            inverse->affectedEdges = affectedEdges;
#else
            inverse->affectedEdges = [affectedEdges retain];
#endif
			break;
		case BoundingBoxChange:
			inverse->oldBoundingBox = nwBoundingBox;
			inverse->nwBoundingBox = oldBoundingBox;
			break;
		case GraphPropertyChange:
#if __has_feature(objc_arc)
            inverse->oldGraphData = nwGraphData;
            inverse->nwGraphData = oldGraphData;
#else
            inverse->oldGraphData = [nwGraphData retain];
            inverse->nwGraphData = [oldGraphData retain];
#endif
			break;
		case NodeOrderChange:
#if __has_feature(objc_arc)
            inverse->affectedNodes = affectedNodes;
            inverse->oldNodeOrder = nwNodeOrder;
            inverse->nwNodeOrder = oldNodeOrder;
#else
            inverse->affectedNodes = [affectedNodes retain];
            inverse->oldNodeOrder = [nwNodeOrder retain];
            inverse->nwNodeOrder = [oldNodeOrder retain];
#endif
			break;
		case EdgeOrderChange:
#if __has_feature(objc_arc)
            inverse->affectedEdges = affectedEdges;
            inverse->oldEdgeOrder = nwEdgeOrder;
            inverse->nwEdgeOrder = oldEdgeOrder;
#else
            inverse->affectedEdges = [affectedEdges retain];
            inverse->oldEdgeOrder = [nwEdgeOrder retain];
            inverse->nwEdgeOrder = [oldEdgeOrder retain];
#endif
			break;
	}
#if __has_feature(objc_arc)
    return inverse;
#else
	return [inverse autorelease];
#endif
}

+ (GraphChange*)graphAdditionWithNodes:(NSSet *)ns edges:(NSSet *)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphAddition];
	[gc setAffectedNodes:ns];
	[gc setAffectedEdges:es];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)graphDeletionWithNodes:(NSSet *)ns edges:(NSSet *)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphDeletion];
	[gc setAffectedNodes:ns];
	[gc setAffectedEdges:es];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)propertyChangeOfNode:(Node*)nd fromOld:(Node*)old toNew:(Node*)nw {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodePropertyChange];
	[gc setNodeRef:nd];
	[gc setOldNode:old];
	[gc setNwNode:nw];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)propertyChangeOfNodesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesPropertyChange];
	[gc setOldNodeTable:oldC];
	[gc setNwNodeTable:newC];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)propertyChangeOfEdge:(Edge*)e fromOld:(Edge *)old toNew:(Edge *)nw {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgePropertyChange];
	[gc setEdgeRef:e];
	[gc setOldEdge:old];
	[gc setNwEdge:nw];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)propertyChangeOfEdgesFromOldCopies:(NSMapTable*)oldC
									   toNewCopies:(NSMapTable*)newC {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgesPropertyChange];
	[gc setOldEdgeTable:oldC];
	[gc setNwEdgeTable:newC];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)shiftNodes:(NSSet*)ns byPoint:(NSPoint)p {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesShift];
	[gc setAffectedNodes:ns];
	[gc setShiftPoint:p];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)flipNodes:(NSSet*)ns horizontal:(BOOL)b {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodesFlip];
	[gc setAffectedNodes:ns];
	[gc setHorizontal:b];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)reverseEdges:(NSSet*)es {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgesReverse];
	[gc setAffectedEdges:es];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)changeBoundingBoxFrom:(NSRect)oldBB to:(NSRect)newBB {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:BoundingBoxChange];
	[gc setOldBoundingBox:oldBB];
	[gc setNwBoundingBox:newBB];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)propertyChangeOfGraphFrom:(GraphElementData*)oldData to:(GraphElementData*)newData {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:GraphPropertyChange];
	[gc setOldGraphData:oldData];
	[gc setNwGraphData:newData];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)nodeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:NodeOrderChange];
	[gc setAffectedNodes:affected];
	[gc setOldNodeOrder:old];
	[gc setNwNodeOrder:new];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

+ (GraphChange*)edgeOrderChangeFrom:(NSArray*)old to:(NSArray*)new moved:(NSSet*)affected {
	GraphChange *gc = [[GraphChange alloc] init];
	[gc setChangeType:EdgeOrderChange];
	[gc setAffectedEdges:affected];
	[gc setOldEdgeOrder:old];
	[gc setNwEdgeOrder:new];
#if __has_feature(objc_arc)
    return gc;
#else
    return [gc autorelease];
#endif
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
