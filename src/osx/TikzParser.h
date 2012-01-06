//
//  TikzParser.h
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

#import <Cocoa/Cocoa.h>
#import <ParseKit/ParseKit.h>

#import "Graph.h"

@interface TikzParser : NSObject {
	PKParser *nodeParser;
	PKParser *edgeParser;
	PKParser *tikzPictureParser;
	PKTokenizer *tokenizer;
	
	NSString *currentKey;
	NSString *currentSourceArrow;
	
	NSMutableArray *atoms;
	NSMutableDictionary *properties;
	NSString *leftArrow;
	NSString *rightArrow;
	
	GraphElementData *elementData;
	
	Graph *graph;
	Node *currentNode;
	NSMutableDictionary *nodeTable;
	
	Edge *currentEdge;
	BOOL matchingEdgeNode;
	NSString *sourceName;
	NSString *targName;
	
	NSPoint bbox1, bbox2;
	BOOL bboxFirstPoint;
}

@property (retain) Graph *graph;

- (id)init;
- (BOOL)parseNode:(NSString*)str;
- (BOOL)parseEdge:(NSString*)str;
- (BOOL)parseTikzPicture:(NSString*)str forGraph:(Graph*)g;
- (BOOL)parseTikzPicture:(NSString *)str;

@end
