//
//  Graph.m
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

#import "Graph.h"

@implementation Graph

- (Graph*)init {
	self = [super init];
	if (self != nil) {
		data = [[GraphElementData alloc] init];
		boundingBox = NSMakeRect(0, 0, 0, 0);
		graphLock = [[NSRecursiveLock alloc] init];
		nodes = [[NSMutableArray alloc] initWithCapacity:10];
		edges = [[NSMutableArray alloc] initWithCapacity:10];
		inEdges = nil;
		outEdges = nil;
	}
	return self;
}

- (id) copyWithZone:(NSZone*)zone {
	Graph *newGraph = [self copyOfSubgraphWithNodes:[NSSet setWithArray:nodes] zone:zone];
	[newGraph setData:[self data]];
	return newGraph;
}

- (void)dealloc {
	[graphLock lock];
	[inEdges release];
	[outEdges release];
	[edges release];
	[nodes release];
	[data release];
	[graphLock unlock];
	[graphLock release];
	
	[super dealloc];
}

- (void)sync {
	[graphLock lock];
	if (dirty) {
		[inEdges release];
		[outEdges release];
		inEdges = [[NSMapTable alloc] initWithKeyOptions:NSMapTableStrongMemory valueOptions:NSMapTableStrongMemory capacity:10];
		outEdges = [[NSMapTable alloc] initWithKeyOptions:NSMapTableStrongMemory valueOptions:NSMapTableStrongMemory capacity:10];
		
		NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
		
		for (Edge *e in edges) {
			NSMutableSet *ie = [inEdges objectForKey:[e target]];
			NSMutableSet *oe = [outEdges objectForKey:[e source]];
			
			if (ie == nil) {
				ie = [NSMutableSet setWithCapacity:4];
				[inEdges setObject:ie forKey:[e target]];
			}
			
			if (oe == nil) {
				oe = [NSMutableSet setWithCapacity:4];
				[outEdges setObject:oe forKey:[e source]];
			}
			
			[ie addObject:e];
			[oe addObject:e];
		}
		
		[pool drain];
		
		
		dirty = NO;
	}
	[graphLock unlock];
}

@synthesize nodes;
@synthesize edges;

@synthesize data;
- (void) insertObject:(GraphElementProperty*)gep
		inDataAtIndex:(NSUInteger)index {
	[data insertObject:gep atIndex:index];
}
- (void) removeObjectFromDataAtIndex:(NSUInteger)index {
	[data removeObjectAtIndex:index];
}
- (void) replaceObjectInDataAtIndex:(NSUInteger)index
						 withObject:(GraphElementProperty*)gep {
	[data replaceObjectAtIndex:index withObject:gep];
}

@synthesize boundingBox;

- (NSRect)bounds {
	[graphLock lock];
	NSRect b = [Graph boundsForNodes:nodes];
	[graphLock unlock];
	return b;
}

- (BOOL)hasBoundingBox {
	return !(
		boundingBox.size.width == 0 &&
		boundingBox.size.height == 0
	);
}

- (NSSet*)inEdgesForNode:(Node*)nd {
	return [[[inEdges objectForKey:nd] retain] autorelease];
}

- (NSSet*)outEdgesForNode:(Node*)nd {
	return [[[outEdges objectForKey:nd] retain] autorelease];
}

- (NSSet*)incidentEdgesForNodes:(NSSet*)nds {
	[self sync];
	
	NSMutableSet *mset = [NSMutableSet setWithCapacity:10];
	for (Node *n in nds) {
		[mset unionSet:[self inEdgesForNode:n]];
		[mset unionSet:[self outEdgesForNode:n]];
	}
	
	return mset;
}

- (void)applyTransformer:(Transformer *)t {
	[graphLock lock];
	for (Node *n in nodes) {
		[n setPoint:[t toScreen:[n point]]];
	}
	[graphLock unlock];
}

- (GraphChange*)addNode:(Node *)node{
    [graphLock lock];
    NSSet *addedNode;
    
    // addNode is a no-op if graph already contains node
	if (![nodes containsObject:node]) {
        [nodes addObject:node];
        dirty = YES;
        addedNode = [NSSet setWithObject:node];
    } else {
        addedNode = [NSSet set];
    }
    [graphLock unlock];
    
	return [GraphChange graphAdditionWithNodes:addedNode
										 edges:[NSSet set]];
}

- (GraphChange*)removeNode:(Node*)node {
    [graphLock lock];
    NSMutableSet *affectedEdges = [NSMutableSet set];
	for (Edge *e in edges) {
		if ([e source] == node || [e target] == node) {
			[affectedEdges addObject:e];
		}
	}
	for (Edge *e in affectedEdges) {
		[edges removeObject:e];
	}
	[nodes removeObject:node];
	dirty = YES;
    [graphLock unlock];
    
    return [GraphChange graphDeletionWithNodes:[NSSet setWithObject:node]
										 edges:affectedEdges];
}

- (GraphChange*)removeNodes:(NSSet *)nds {
	[graphLock lock];
	
	Node *n;
	Edge *e;
	
	NSMutableSet *affectedEdges = [NSMutableSet set];
	NSEnumerator *en = [edges objectEnumerator];
	while ((e = [en nextObject])) {
		if ([nds containsObject:[e source]] || [nds containsObject:[e target]]) {
			[affectedEdges addObject:e];
		}
	}
	
	en = [affectedEdges objectEnumerator];
	while ((e = [en nextObject])) [edges removeObject:e];
	
	en = [nds objectEnumerator];
	while ((n = [en nextObject])) [nodes removeObject:n];
	
	dirty = YES;
	[graphLock unlock];
	
	return [GraphChange graphDeletionWithNodes:nds edges:affectedEdges];
}

- (GraphChange*)addEdge:(Edge*)edge {
    [graphLock lock];
    NSSet *addedEdge;
    
    // addEdge is a no-op if graph already contains edge
    if (![edges containsObject:edge]) {
        [edges addObject:edge];
        dirty = YES;
        addedEdge = [NSSet setWithObject:edge];
    } else {
        addedEdge = [NSSet set];
    }
    [graphLock unlock];
    
    return [GraphChange graphAdditionWithNodes:[NSSet set]
										 edges:addedEdge];
}

- (GraphChange*)removeEdge:(Edge *)edge {
	[graphLock lock];
	[edges removeObject:edge];
	dirty = YES;
	[graphLock unlock];
	return [GraphChange graphDeletionWithNodes:[NSSet set]
										 edges:[NSSet setWithObject:edge]];
}

- (GraphChange*)removeEdges:(NSSet *)es {
	[graphLock lock];
	
	NSEnumerator *en = [es objectEnumerator];
	Edge *e;
	while ((e = [en nextObject])) {
		[edges removeObject:e];
	}
	dirty = YES;
	[graphLock unlock];
	return [GraphChange graphDeletionWithNodes:[NSSet set] edges:es];
}

- (GraphChange*)addEdgeFrom:(Node *)source to:(Node *)target {
	return [self addEdge:[Edge edgeWithSource:source andTarget:target]];
}

- (GraphChange*)shiftNodes:(id<NSFastEnumeration>)ns byPoint:(NSPoint)p {
	NSPoint newLoc;
    NSMutableSet *nodeSet = [NSMutableSet setWithCapacity:5];
	for (Node *n in ns) {
		newLoc = NSMakePoint([n point].x + p.x, [n point].y + p.y);
		[n setPoint:newLoc];
        [nodeSet addObject:n];
	}
	return [GraphChange shiftNodes:nodeSet byPoint:p];
}

- (int)indexOfNode:(Node *)node {
    return [nodes indexOfObject:node];
}

- (void)setIndex:(int)idx ofNode:(Node *)node {
    [graphLock lock];
    
    if ([nodes containsObject:node]) {
        [nodes removeObject:node];
        [nodes insertObject:node atIndex:idx]; 
    }
    
    [graphLock unlock];
}

- (int)indexOfEdge:(Edge *)edge {
    return [edges indexOfObject:edge];
}

- (void)setIndex:(int)idx ofEdge:(Edge *)edge {
    [graphLock lock];
    
    if ([edges containsObject:edge]) {
        [edges removeObject:edge];
        [edges insertObject:edge atIndex:idx];
    }
    
    [graphLock unlock];
}

- (GraphChange*)bringNodesForward:(NSSet*)nodeSet {
	NSArray *oldOrder = [nodes copy];
    [graphLock lock];
    // start at the top of the array and work backwards
    for (int i = [nodes count]-2; i >= 0; --i) {
        if ( [nodeSet containsObject:[nodes objectAtIndex:i]] &&
            ![nodeSet containsObject:[nodes objectAtIndex:i+1]])
        {
            [self setIndex:(i+1) ofNode:[nodes objectAtIndex:i]];
        }
    }
	GraphChange *change = [GraphChange nodeOrderChangeFrom:oldOrder to:nodes moved:nodeSet];
    [graphLock unlock];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)bringNodesToFront:(NSSet*)nodeSet {
	NSArray *oldOrder = [nodes copy];
    int i = 0, top = [nodes count]-1;
    
    while (i <= top) {
        if ([nodeSet containsObject:[nodes objectAtIndex:i]]) {
            [self setIndex:([nodes count]-1) ofNode:[nodes objectAtIndex:i]];
            --top;
        } else {
            ++i;
        }
    }
	GraphChange *change = [GraphChange nodeOrderChangeFrom:oldOrder to:nodes moved:nodeSet];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)bringEdgesForward:(NSSet*)edgeSet {
    [graphLock lock];
	NSArray *oldOrder = [edges copy];
    // start at the top of the array and work backwards
    for (int i = [edges count]-2; i >= 0; --i) {
        if ( [edgeSet containsObject:[edges objectAtIndex:i]] &&
            ![edgeSet containsObject:[edges objectAtIndex:i+1]])
        {
            [self setIndex:(i+1) ofEdge:[edges objectAtIndex:i]];
        }
    }
	GraphChange *change = [GraphChange edgeOrderChangeFrom:oldOrder to:edges moved:edgeSet];
    [graphLock unlock];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)bringEdgesToFront:(NSSet*)edgeSet {
	NSArray *oldOrder = [edges copy];
    int i = 0, top = [edges count]-1;
    
    while (i <= top) {
        if ([edgeSet containsObject:[edges objectAtIndex:i]]) {
            [self setIndex:([edges count]-1) ofEdge:[edges objectAtIndex:i]];
            --top;
        } else {
            ++i;
        }
    }
	GraphChange *change = [GraphChange edgeOrderChangeFrom:oldOrder to:edges moved:edgeSet];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)sendNodesBackward:(NSSet*)nodeSet {
    [graphLock lock];
	NSArray *oldOrder = [nodes copy];
    // start at the top of the array and work backwards
    for (int i = 1; i < [nodes count]; ++i) {
        if ( [nodeSet containsObject:[nodes objectAtIndex:i]] &&
            ![nodeSet containsObject:[nodes objectAtIndex:i-1]])
        {
            [self setIndex:(i-1) ofNode:[nodes objectAtIndex:i]];
        }
    }
	GraphChange *change = [GraphChange nodeOrderChangeFrom:oldOrder to:nodes moved:nodeSet];
    [graphLock unlock];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)sendEdgesBackward:(NSSet*)edgeSet {
    [graphLock lock];
	NSArray *oldOrder = [edges copy];
    // start at the top of the array and work backwards
    for (int i = 1; i < [edges count]; ++i) {
        if ( [edgeSet containsObject:[edges objectAtIndex:i]] &&
            ![edgeSet containsObject:[edges objectAtIndex:i-1]])
        {
            [self setIndex:(i-1) ofEdge:[edges objectAtIndex:i]];
        }
    }
	GraphChange *change = [GraphChange edgeOrderChangeFrom:oldOrder to:edges moved:edgeSet];
    [graphLock unlock];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)sendNodesToBack:(NSSet*)nodeSet {
	NSArray *oldOrder = [nodes copy];
    int i = [nodes count]-1, bot = 0;
    
    while (i >= bot) {
        if ([nodeSet containsObject:[nodes objectAtIndex:i]]) {
            [self setIndex:0 ofNode:[nodes objectAtIndex:i]];
            ++bot;
        } else {
            --i;
        }
    }
	GraphChange *change = [GraphChange nodeOrderChangeFrom:oldOrder to:nodes moved:nodeSet];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)sendEdgesToBack:(NSSet*)edgeSet {
	NSArray *oldOrder = [edges copy];
    int i = [edges count]-1, bot = 0;
    
    while (i >= bot) {
        if ([edgeSet containsObject:[edges objectAtIndex:i]]) {
            [self setIndex:0 ofEdge:[edges objectAtIndex:i]];
            ++bot;
        } else {
            --i;
        }
    }
	GraphChange *change = [GraphChange edgeOrderChangeFrom:oldOrder to:edges moved:edgeSet];
	[oldOrder release];
    
    return change;
}

- (GraphChange*)insertGraph:(Graph*)g {
	[graphLock lock];
	
	for (Node *n in [g nodes]) {
		[self addNode:n];
	}
	
	for (Edge *e in [g edges]) {
		[self addEdge:e];
	}
	
	dirty = YES;
	
	[graphLock unlock];
    
	
	return [GraphChange graphAdditionWithNodes:[NSSet setWithArray:[g nodes]] edges:[NSSet setWithArray:[g edges]]];
}

- (void)flipNodes:(NSSet*)nds horizontal:(BOOL)horiz {
	[graphLock lock];
	
	NSRect bds = [Graph boundsForNodes:nds];
	float ctr;
	if (horiz) ctr = bds.origin.x + (bds.size.width/2);
	else ctr = bds.origin.y + (bds.size.height/2);
	
	Node *n;
	NSPoint p;
	NSEnumerator *en = [nds objectEnumerator];
	while ((n = [en nextObject])) {
		p = [n point];
		if (horiz) p.x = 2 * ctr - p.x;
		else p.y = 2 * ctr - p.y;
		[n setPoint:p];
	}
	
	Edge *e;
	en = [edges objectEnumerator];
	while ((e = [en nextObject])) {
		if ([nds containsObject:[e source]] &&
			[nds containsObject:[e target]])
		{
			if ([e bendMode] == EdgeBendModeInOut) {
				if (horiz) {
					if ([e inAngle] < 0) [e setInAngle:(-180 - [e inAngle])];
					else [e setInAngle:180 - [e inAngle]];
					
					if ([e outAngle] < 0) [e setOutAngle:(-180 - [e outAngle])];
					else [e setOutAngle:180 - [e outAngle]];
				} else {
					[e setInAngle:-[e inAngle]];
					[e setOutAngle:-[e outAngle]];
				}
			} else {
				[e setBend:-[e bend]];
			}
		}
	}

	[graphLock unlock];
}

- (GraphChange*)flipHorizontalNodes:(NSSet*)nds {
	[self flipNodes:nds horizontal:YES];
	return [GraphChange flipNodes:nds horizontal:YES];
}

- (GraphChange*)flipVerticalNodes:(NSSet*)nds {
	[self flipNodes:nds horizontal:NO];
	return [GraphChange flipNodes:nds horizontal:NO];
}

- (Graph*)copyOfSubgraphWithNodes:(NSSet*)nds {
	return [self copyOfSubgraphWithNodes:nds zone:NSDefaultMallocZone()];
}

- (Graph*)copyOfSubgraphWithNodes:(NSSet*)nds zone:(NSZone*)zone {
	[graphLock lock];

	NSMapTable *newNds = [Graph nodeTableForNodes:nds withZone:zone];
	Graph* newGraph = [[Graph allocWithZone:zone] init];

	for (Node *nd in newNds) {
		[newGraph addNode:nd];
	}

	for (Edge *e in edges) {
		if ([nds containsObject:[e source]] && [nds containsObject:[e target]]) {
			Edge *e1 = [e copyWithZone:zone];
			[e1 setSource:[newNds objectForKey:[e source]]];
			[e1 setTarget:[newNds objectForKey:[e target]]];
			[newGraph addEdge:e1];
			[e1 release]; // e1 belongs to newGraph
		}
	}

	[graphLock unlock];

	return newGraph;
}

- (NSSet*)pathCover {
	[self sync];
	
	NSMutableSet *cover = [NSMutableSet set];
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
	NSMutableSet *remainingEdges = [NSMutableSet setWithArray:edges];
	
	while ([remainingEdges count] != 0) {
		NSMutableArray *path = [[NSMutableArray alloc] init];
		NSSet *succs;
		Edge *succ;
		NSEnumerator *en;
		
		Edge *e = [remainingEdges anyObject];
		
		while (e!=nil) {
			[path addObject:e];
			[remainingEdges removeObject:e];
			
			succs = [self outEdgesForNode:[e target]];
			en = [succs objectEnumerator];
			e = nil;
			
			while ((succ = [en nextObject])) {
				if ([remainingEdges containsObject:succ]) e = succ;
			}
		}
		
		[cover addObject:path];
		[path release];
	}
	
	[pool drain];
	return cover;
}

- (void)applyGraphChange:(GraphChange*)ch {
	[graphLock lock];
	Node *n;
	Edge *e;
	NSEnumerator *en;
	switch ([ch changeType]) {
		case GraphAddition:
			en = [[ch affectedNodes] objectEnumerator];
			while ((n = [en nextObject])) [nodes addObject:n];

			en = [[ch affectedEdges] objectEnumerator];
			while ((e = [en nextObject])) [edges addObject:e];

			break;
		case GraphDeletion:
			en = [[ch affectedEdges] objectEnumerator];
			while ((e = [en nextObject])) [edges removeObject:e];

			en = [[ch affectedNodes] objectEnumerator];
			while ((n = [en nextObject])) [nodes removeObject:n];

			break;
		case NodePropertyChange:
			[[ch nodeRef] setPropertiesFromNode:[ch nwNode]];
			break;
		case NodesPropertyChange:
			{
				en = [[ch nwNodeTable] keyEnumerator];
				Node *key;
				while ((key = [en nextObject])) {
					[key setPropertiesFromNode:[[ch nwNodeTable] objectForKey:key]];
				}
			}
			break;
		case EdgePropertyChange:
			[[ch edgeRef] setPropertiesFromEdge:[ch nwEdge]];
			break;
		case EdgesPropertyChange:
			{
				en = [[ch nwEdgeTable] keyEnumerator];
				Edge *key;
				while ((key = [en nextObject])) {
					[key setPropertiesFromEdge:[[ch nwEdgeTable] objectForKey:key]];
				}
			}
			break;
		case NodesShift:
			en = [[ch affectedNodes] objectEnumerator];
			NSPoint newLoc;
			while ((n = [en nextObject])) {
				newLoc = NSMakePoint([n point].x + [ch shiftPoint].x,
									 [n point].y + [ch shiftPoint].y);
				[n setPoint:newLoc];
			}
			break;
		case NodesFlip:
			[self flipNodes:[ch affectedNodes] horizontal:[ch horizontal]];
			break;
		case BoundingBoxChange:
			[self setBoundingBox:[ch nwBoundingBox]];
			break;
		case GraphPropertyChange:
			[data setArray:[ch nwGraphData]];
			break;
		case NodeOrderChange:
			[nodes setArray:[ch newNodeOrder]];
			break;
		case EdgeOrderChange:
			[edges setArray:[ch newEdgeOrder]];
			break;
	}

	dirty = YES;
	[graphLock unlock];
}

//- (void)undoGraphChange:(GraphChange*)ch {
//	[self applyGraphChange:[GraphChange inverseGraphChange:ch]];
//}

- (NSString*)tikz {
	[graphLock lock];
	
	NSMutableString *code = [NSMutableString
							 stringWithFormat:@"\\begin{tikzpicture}%@\n",
							 [[self data] stringList]];
	
	if ([self hasBoundingBox]) {
		[code appendFormat:@"\t\\path [use as bounding box] (%@,%@) rectangle (%@,%@);\n",
			[NSNumber numberWithFloat:boundingBox.origin.x],
			[NSNumber numberWithFloat:boundingBox.origin.y],
			[NSNumber numberWithFloat:boundingBox.origin.x + boundingBox.size.width],
			[NSNumber numberWithFloat:boundingBox.origin.y + boundingBox.size.height]];
	}
	
//	NSArray *sortedNodeList = [[nodes allObjects]
//				     sortedArrayUsingSelector:@selector(compareTo:)];
	//NSMutableDictionary *nodeNames = [NSMutableDictionary dictionary];
	
	if ([nodes count] > 0) [code appendFormat:@"\t\\begin{pgfonlayer}{nodelayer}\n"];
	
	int i = 0;
	for (Node *n in nodes) {
		[n updateData];
		[n setName:[NSString stringWithFormat:@"%d", i]];
		[code appendFormat:@"\t\t\\node %@ (%d) at (%@, %@) {%@};\n",
			[[n data] stringList],
			i,
			[NSNumber numberWithFloat:[n point].x],
			[NSNumber numberWithFloat:[n point].y],
			[n label]
		];
        i++;
	}
	
	if ([nodes count] > 0) [code appendFormat:@"\t\\end{pgfonlayer}\n"];
	if ([edges count] > 0) [code appendFormat:@"\t\\begin{pgfonlayer}{edgelayer}\n"];
	
	NSString *nodeStr;
	for (Edge *e in edges) {
		[e updateData];
		
		if ([e hasEdgeNode]) {
			nodeStr = [NSString stringWithFormat:@"node%@{%@} ",
					   [[[e edgeNode] data] stringList],
					   [[e edgeNode] label]
					   ];
		} else {
			nodeStr = @"";
		}
		
		NSString *edata = [[e data] stringList];
		
		[code appendFormat:@"\t\t\\draw%@ (%@%@) to %@(%@%@);\n",
			([edata isEqual:@""]) ? @"" : [NSString stringWithFormat:@" %@", edata],
			[[e source] name],
			([[e source] style] == nil) ? @".center" : @"",
			nodeStr,
			([e source] == [e target]) ? @"" : [[e target] name],
			([e source] != [e target] && [[e target] style] == nil) ? @".center" : @""
		];
	}
	
	if ([edges count] > 0) [code appendFormat:@"\t\\end{pgfonlayer}\n"];
	
	[code appendString:@"\\end{tikzpicture}"];	
	
	[graphLock unlock];
	
	return code;
}

+ (Graph*)graph {
	return [[[self alloc] init] autorelease];
}

+ (NSMapTable*)nodeTableForNodes:(NSSet*)nds {
	return [self nodeTableForNodes:nds withZone:NSDefaultMallocZone()];
}

+ (NSMapTable*)nodeTableForNodes:(NSSet*)nds withZone:(NSZone*)zone {
	NSMapTable *tab = [[NSMapTable allocWithZone:zone]
							  initWithKeyOptions:NSMapTableStrongMemory
									valueOptions:NSMapTableStrongMemory
										capacity:[nds count]];
	for (Node *n in nds) {
		Node *ncopy = [n copyWithZone:zone];
		[tab setObject:ncopy forKey:n];
		[ncopy release]; // tab should still retain ncopy.
	}
	return tab;
}

+ (NSMapTable*)edgeTableForEdges:(NSSet*)es {
	return [self edgeTableForEdges:es withZone:NSDefaultMallocZone()];
}

+ (NSMapTable*)edgeTableForEdges:(NSSet*)es withZone:(NSZone*)zone {
	NSMapTable *tab = [[NSMapTable allocWithZone:zone]
							  initWithKeyOptions:NSMapTableStrongMemory
									valueOptions:NSMapTableStrongMemory
										capacity:[es count]];
	for (Edge *e in es) {
		Edge *ecopy = [e copyWithZone:zone];
		[tab setObject:ecopy forKey:e];
		[ecopy release]; // tab should still retain ecopy.
	}
	return tab;
}


+ (NSRect)boundsForNodes:(id<NSFastEnumeration>)nds {
	NSPoint tl, br;
	NSPoint p;
    BOOL hasPoints = NO;
    for (Node *n in nds) {
        p = [n point];
        if (!hasPoints) {
            tl = p;
            br = p;
            hasPoints = YES;
        } else {
            if (p.x < tl.x) tl.x = p.x;
            if (p.y > tl.y) tl.y = p.y;
            if (p.x > br.x) br.x = p.x;
            if (p.y < br.y) br.y = p.y;
        }
    }
    
    return (hasPoints) ? NSRectAroundPoints(tl, br) : NSMakeRect(0, 0, 0, 0);
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
