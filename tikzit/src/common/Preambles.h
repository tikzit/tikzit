//
//  Preambles.h
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  Copyright 2011 Alex Merry. All rights reserved.
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
#import "StyleManager.h"

@class Graph;

@interface Preambles : NSObject {
	NSMutableDictionary *preambleDict;
	NSString *selectedPreambleName;
	NSArray *styles;
	NSArray *edges;
	StyleManager *styleManager;
}

@property (copy)     NSString            *selectedPreambleName;
@property (retain)   NSString            *currentPreamble;
@property (retain)   StyleManager        *styleManager;
@property (readonly) NSMutableDictionary *preambleDict;

+ (Preambles*)preambles;
- (id)init;
- (void)setStyles:(NSArray*)sty;
- (void)setEdges:(NSArray*)edg;

- (NSString*)preambleForName:(NSString*)name;
- (BOOL)setPreamble:(NSString*)content forName:(NSString*)name;

- (NSString*)addPreamble;
- (NSString*)addPreambleWithNameBase:(NSString*)name;

- (BOOL)renamePreambleFrom:(NSString*)old to:(NSString*)new;
- (BOOL)removePreamble:(NSString*)name;

- (NSEnumerator*)customPreambleNameEnumerator;

- (void)removeAllPreambles;

- (BOOL)selectedPreambleIsDefault;

- (NSString*)styleDefinitions;
- (NSString*)defaultPreamble;
- (NSString*)defaultPreambleName;
- (NSString*)currentPostamble;

- (NSString*)buildDocumentForTikz:(NSString*)tikz;
- (NSString*)buildDocumentForGraph:(Graph*)g;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
