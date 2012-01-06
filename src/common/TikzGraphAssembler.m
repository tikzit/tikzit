//
//  TikzGraphAssembler.m
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

#import "TikzGraphAssembler.h"

extern int yyparse(void);
extern int yylex(void);  
extern int yy_scan_string(const char* yy_str);
extern void yy_delete_buffer(int b);
extern int yylex_destroy(void);


static NSLock *parseLock = nil;
static id currentAssembler = nil;

void yyerror(const char *str) {
	NSLog(@"Parse error: %s", str);
	if (currentAssembler != nil) {
		[currentAssembler invalidate];
	}
}

int yywrap() {
	return 1;
}

@implementation TikzGraphAssembler

- (id)init {
	[super init];
	graph = nil;
	currentNode = nil;
	currentEdge = nil;
	nodeMap = nil;
	return self;
}

- (Graph*)graph { return graph; }

- (GraphElementData *)data {
	if (currentNode != nil) {
		return [currentNode data];
	} else if (currentEdge != nil) {
		return [currentEdge data];
	} else {
		return [graph data];
	}
}

- (Node*)currentNode { return currentNode; }
- (Edge*)currentEdge { return currentEdge; }

- (BOOL)parseTikz:(NSString *)tikz {
	return [self parseTikz:tikz forGraph:[Graph graph]];
}

- (BOOL)parseTikz:(NSString*)tikz forGraph:(Graph*)gr {
	[parseLock lock];
	
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	currentAssembler = self;
	
	// set the current graph
	if (graph != gr) {
		[graph release];
		graph = [gr retain];
	}
	
	// the node map keeps track of the mapping of names to nodes
	nodeMap = [[NSMutableDictionary alloc] init];
	
	// do the parsing
	yy_scan_string([tikz UTF8String]);
	yyparse();   
	yylex_destroy();
	
	[nodeMap release];
	
	currentAssembler = nil;
	[pool drain];
	
	[parseLock unlock];
	
	return (graph != nil);
}

- (void)prepareNode {
	currentNode = [[Node alloc] init];
}

- (void)finishNode {
	if (currentEdge != nil) { // this is an edge node
		[currentEdge setEdgeNode:currentNode];
	} else { // this is a normal node
		[graph addNode:currentNode];
		[nodeMap setObject:currentNode forKey:[currentNode name]];
	}
	
	[currentNode release];
	currentNode = nil;
}

- (void)prepareEdge {
	currentEdge = [[Edge alloc] init];
}

- (void)finishEdge {
	[currentEdge setAttributesFromData];
	[graph addEdge:currentEdge];
	[currentEdge release];
	currentEdge = nil;
}

- (void)setEdgeSource:(NSString*)src target:(NSString*)targ {
	if (![targ isEqualToString:@""]) {
		[currentEdge setSource:[nodeMap objectForKey:src]];
		[currentEdge setTarget:[nodeMap objectForKey:targ]];
	} else {
		Node *s = [nodeMap objectForKey:src];
		[currentEdge setSource:s];
		[currentEdge setTarget:s];
	}
}

- (void)dealloc {
	[graph release];
	[super dealloc];
}

- (void)invalidate {
	[graph release];
	graph = nil;
}

+ (void)setup {
	parseLock = [[NSLock alloc] init];
}

+ (TikzGraphAssembler*)currentAssembler {
	return currentAssembler;
}

+ (TikzGraphAssembler*)assembler {
	return [[[TikzGraphAssembler alloc] init] autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
