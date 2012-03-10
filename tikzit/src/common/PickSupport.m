//
//  PickSupport.m
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

#import "PickSupport.h"


@implementation PickSupport

- (void) postNodeSelectionChanged {
	[[NSNotificationCenter defaultCenter]
		postNotificationName:@"NodeSelectionChanged"
		object:self];
}

- (void) postEdgeSelectionChanged {
	[[NSNotificationCenter defaultCenter]
		postNotificationName:@"EdgeSelectionChanged"
		object:self];
}

- (id) init {
	self = [super init];

	if (self) {
		selectedNodes = [[NSMutableSet set] retain];
		selectedEdges = [[NSMutableSet set] retain];
	}

	return self;
}

+ (PickSupport*)pickSupport {
	return [[[PickSupport alloc] init] autorelease];
}

@synthesize selectedNodes;
- (void)addSelectedNodesObject:(Node*)node {
	return [self selectNode:node];
}
- (void)addSelectedNodes:(NSSet*)nodes {
	return [self selectAllNodes:nodes replacingSelection:NO];
}
- (void)removeSelectedNodesObject:(Node*)node {
	return [self deselectNode:node];
}
- (void)removeSelectedNodes:(NSSet*)nodes {
	if ([selectedNodes count] > 0) {
		[selectedNodes minusSet:nodes];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"NodeSelectionReplaced"
			object:self];
		[self postNodeSelectionChanged];
	}
}

@synthesize selectedEdges;
- (void)addSelectedEdgesObject:(Edge*)edge {
	return [self selectEdge:edge];
}
- (void)addSelectedEdges:(NSSet*)edges {
	if (selectedEdges == edges) {
		return;
	}
	if ([edges count] == 0) {
		return;
	}

	[selectedEdges unionSet:edges];
	[[NSNotificationCenter defaultCenter]
		postNotificationName:@"EdgeSelectionReplaced"
		object:self];
	[self postEdgeSelectionChanged];
}
- (void)removeSelectedEdgesObject:(Edge*)edge {
	return [self deselectEdge:edge];
}
- (void)removeSelectedEdges:(NSSet*)edges {
	if ([selectedEdges count] > 0 && [edges count] > 0) {
		[selectedEdges minusSet:edges];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"EdgeSelectionReplaced"
			object:self];
		[self postEdgeSelectionChanged];
	}
}

- (BOOL)isNodeSelected:(Node*)nd {
	return [selectedNodes containsObject:nd];
}

- (BOOL)isEdgeSelected:(Edge*)e {
	return [selectedEdges containsObject:e];
}

- (void)selectNode:(Node*)nd {
	if (nd != nil && ![selectedNodes member:nd]) {
		[selectedNodes addObject:nd];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"NodeSelected"
			object:self
			userInfo:[NSDictionary dictionaryWithObject:nd forKey:@"node"]];
		[self postNodeSelectionChanged];
	}
}

- (void)deselectNode:(Node*)nd {
	if (nd != nil && [selectedNodes member:nd]) {
		[selectedNodes removeObject:nd];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"NodeDeselected"
			object:self
			userInfo:[NSDictionary dictionaryWithObject:nd forKey:@"node"]];
		[self postNodeSelectionChanged];
	}
}

- (void)selectEdge:(Edge*)e {
	if (e != nil && ![selectedEdges member:e]) {
		[selectedEdges addObject:e];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"EdgeSelected"
			object:self
			userInfo:[NSDictionary dictionaryWithObject:e forKey:@"edge"]];
		[self postEdgeSelectionChanged];
	}
}

- (void)deselectEdge:(Edge*)e {
	if (e != nil && [selectedEdges member:e]) {
		[selectedEdges removeObject:e];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"EdgeDeselected"
			object:self
			userInfo:[NSDictionary dictionaryWithObject:e forKey:@"edge"]];
		[self postEdgeSelectionChanged];
	}
}

- (void)toggleNodeSelected:(Node*)nd {
	if ([self isNodeSelected:nd])
		[self deselectNode:nd];
	else
		[self selectNode:nd];
}

- (void)selectAllNodes:(NSSet*)nodes {
	[self selectAllNodes:nodes replacingSelection:YES];
}

- (void)selectAllNodes:(NSSet*)nodes replacingSelection:(BOOL)replace {
	if (selectedNodes == nodes) {
		return;
	}
	if (!replace && [nodes count] == 0) {
		return;
	}

	if (replace) {
		[selectedNodes release];
		selectedNodes = [nodes mutableCopy];
	} else {
		[selectedNodes unionSet:nodes];
	}
	[[NSNotificationCenter defaultCenter]
		postNotificationName:@"NodeSelectionReplaced"
		object:self];
	[self postNodeSelectionChanged];
}

- (void)deselectAllNodes {
	if ([selectedNodes count] > 0) {
		[selectedNodes removeAllObjects];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"NodeSelectionReplaced"
			object:self];
		[self postNodeSelectionChanged];
	}
}

- (void)deselectAllEdges {
	if ([selectedEdges count] > 0) {
		[selectedEdges removeAllObjects];
		[[NSNotificationCenter defaultCenter]
			postNotificationName:@"EdgeSelectionReplaced"
			object:self];
		[self postEdgeSelectionChanged];
	}
}

- (void)dealloc {
	[selectedNodes release];
	[selectedEdges release];
	
	[super dealloc];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
