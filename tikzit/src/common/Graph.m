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
#import "BasicMapTable.h"

@implementation Graph

- (Graph*)init {
	[super init];
	data = [[GraphElementData alloc] init];
	boundingBox = NSMakeRect(0, 0, 0, 0);
	graphLock = [[NSRecursiveLock alloc] init];
	[graphLock lock];
	nodes = [[NSMutableSet alloc] initWithCapacity:10];
	edges = [[NSMutableSet alloc] initWithCapacity:10];
	inEdges = nil;
	outEdges = nil;
	dirty = YES;
	[graphLock unlock];
	return self;
}

- (void)sync {
	[graphLock lock];
	if (dirty) {
		[nodesCache release];
		nodesCache = [nodes copy];
		[edgesCache release];
		edgesCache = [edges copy];
		
		
		[inEdges release];
		[outEdges release];
		inEdges = [[BasicMapTable alloc] init];
		outEdges = [[BasicMapTable alloc] init];
		
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

- (NSSet*)nodes {
	[self sync];
	return nodesCache;
}

- (NSSet*)edges {
	[self sync];
	return edgesCache;
}

- (NSRect)bounds {
	[graphLock lock];
	NSRect b = [Graph boundsForNodeSet:nodes];
	[graphLock unlock];
	return b;
}

- (GraphElementData*)data { return data; }
- (void)setData:(GraphElementData *)dt {
	if (data != dt) {
		[data release];
		data = [dt copy];
	}
}

- (NSRect)boundingBox { return boundingBox; }
- (void)setBoundingBox:(NSRect)r {
	boundingBox = r;
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
	[nodes addObject:node];
	dirty = YES;
	[graphLock unlock];
	
	return [GraphChange graphAdditionWithNodes:[NSSet setWithObject:node]
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

- (GraphChange*)addEdge:(Edge *)edge {
	[graphLock lock];
	[edges addObject:edge];
	dirty = YES;
	[graphLock unlock];
	return [GraphChange graphAdditionWithNodes:[NSSet set]
										 edges:[NSSet setWithObject:edge]];
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

- (GraphChange*)shiftNodes:(NSSet*)ns byPoint:(NSPoint)p {
	NSEnumerator *en = [ns objectEnumerator];
	Node *n;
	NSPoint newLoc;
	while ((n = [en nextObject])) {
		newLoc = NSMakePoint([n point].x + p.x, [n point].y + p.y);
		[n setPoint:newLoc];
	}
	return [GraphChange shiftNodes:ns byPoint:p];
}

- (GraphChange*)insertGraph:(Graph*)g {
	[graphLock lock];
	NSEnumerator *en;
	Node *n;
	Edge *e;
	
	en = [[g nodes] objectEnumerator];
	while ((n = [en nextObject])) {
		[nodes addObject:n];
	}
	
	en = [[g edges] objectEnumerator];
	while ((e = [en nextObject])) {
		[edges addObject:e];
	}
	
	dirty = YES;
	
	[graphLock unlock];
	
	return [GraphChange graphAdditionWithNodes:[g nodes] edges:[g edges]];
}

- (void)flipNodes:(NSSet*)nds horizontal:(BOOL)horiz {
	[graphLock lock];
	
	NSRect bds = [Graph boundsForNodeSet:nds];
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
	[graphLock lock];
	
	BasicMapTable *newNds = [Graph nodeTableForNodes:nds];
	Graph* newGraph = [[Graph graph] retain];
	
	NSEnumerator *en = [newNds objectEnumerator];
	Node *nd;
	while ((nd = [en nextObject])) {
		[newGraph addNode:nd];
	}
	
	en = [edges objectEnumerator];
	Edge *e;
	while ((e = [en nextObject])) {
		if ([nds containsObject:[e source]] && [nds containsObject:[e target]]) {
			Edge *e1 = [e copy];
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
	
	NSMutableSet *remainingEdges = [edges mutableCopy];
	NSMutableSet *cover = [NSMutableSet set];
	
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
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
	[remainingEdges release];
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
			[self setData:[ch nwGraphData]];
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
	
	NSArray *sortedNodeList = [[nodes allObjects]
				     sortedArrayUsingSelector:@selector(compareTo:)];
	//NSMutableDictionary *nodeNames = [NSMutableDictionary dictionary];
	
	if ([nodes count] > 0) [code appendFormat:@"\t\\begin{pgfonlayer}{nodelayer}\n"];
	
	int i;
	for (i = 0; i < [sortedNodeList count]; ++i) {
		Node *n = [sortedNodeList objectAtIndex:i];
		[n updateData];
		[n setName:[NSString stringWithFormat:@"%d", i]];
		[code appendFormat:@"\t\t\\node %@ (%d) at (%@, %@) {%@};\n",
			[[n data] stringList],
			i,
			[NSNumber numberWithFloat:[n point].x],
			[NSNumber numberWithFloat:[n point].y],
			[n label]
		];
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

- (void)dealloc {
	[graphLock lock];
	[nodes release];
	[edges release];
	[nodesCache release];
	[edgesCache release];
	[data release];
	[inEdges release];
	[outEdges release];
	[graphLock unlock];
	[graphLock release];
	
	[super dealloc];
}

+ (Graph*)graph {
	return [[[self alloc] init] autorelease];
}

+ (BasicMapTable*)nodeTableForNodes:(NSSet*)nds {
	BasicMapTable *tab = [BasicMapTable mapTable];
	for (Node *n in nds) {
		Node *ncopy = [n copy];
		[tab setObject:ncopy forKey:n];
		[ncopy release]; // tab should still retain ncopy.
	}
	return tab;
}

+ (BasicMapTable*)edgeTableForEdges:(NSSet*)es {
	BasicMapTable *tab = [BasicMapTable mapTable];
	for (Edge *e in es) {
		Edge *ecopy = [e copy];
		[tab setObject:ecopy forKey:e];
		[ecopy release]; // tab should still retain ecopy.
	}
	return tab;
}

+ (NSRect)boundsForNodeSet:(NSSet*)nds {
	NSPoint tl, br;
	Node *n;
	NSPoint p;
	NSEnumerator *en = [nds objectEnumerator];
	if ((n = [en nextObject])==nil) {
		return NSMakeRect(0, 0, 0, 0);
	}
	p = [n point];
	tl = p;
	br = p;
	while ((n = [en nextObject])) {
		p = [n point];
		if (p.x < tl.x) tl.x = p.x;
		if (p.y > tl.y) tl.y = p.y;
		if (p.x > br.x) br.x = p.x;
		if (p.y < br.y) br.y = p.y;
	}
	return NSRectAroundPoints(tl, br);
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
