//
//  TikzGraphAssembler.h
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
#import "Graph.h"

@interface TikzGraphAssembler : NSObject {
	Graph *graph;
	Node *currentNode;
	Edge *currentEdge;
	NSMutableDictionary *nodeMap;
	NSError *lastError;
}

@property (readonly) Graph *graph;
@property (readonly) GraphElementData *data;
@property (readonly) Node *currentNode;
@property (readonly) Edge *currentEdge;
@property (readonly) NSError *lastError;

- (BOOL)parseTikz:(NSString*)tikz;
- (BOOL)parseTikz:(NSString*)tikz forGraph:(Graph*)gr;

- (void)prepareNode;
- (void)finishNode;

- (void)prepareEdge;
- (void)setEdgeSource:(NSString*)edge anchor:(NSString*)anch;
- (void)setEdgeTarget:(NSString*)edge anchor:(NSString*)anch;
- (void)finishEdge;

- (void)invalidate;
- (void)invalidateWithError:(NSError*)error;

+ (void)setup;
+ (TikzGraphAssembler*)currentAssembler;
+ (TikzGraphAssembler*)assembler;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
