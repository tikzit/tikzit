//
//  Preambles.m
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

#import "Preambles.h"
#import "NodeStyle.h"
#import "EdgeStyle.h"
#import "Graph.h"

static NSString *DEF_PREAMBLE_START =
@"\\usepackage[svgnames]{xcolor}\n"
@"\\usepackage{tikz}\n"
@"\\usetikzlibrary{decorations.markings}\n"
@"\\usetikzlibrary{shapes.geometric}\n"
@"\n"
@"\\pgfdeclarelayer{edgelayer}\n"
@"\\pgfdeclarelayer{nodelayer}\n"
@"\\pgfsetlayers{edgelayer,nodelayer,main}\n"
@"\n"
@"\\tikzstyle{none}=[inner sep=0pt]\n";

static NSString *PREAMBLE_TAIL =
@"\n"
@"\\pagestyle{empty}\n"
@"\\usepackage[graphics,tightpage,active]{preview}\n"
@"\\PreviewEnvironment{tikzpicture}\n"
@"\\newlength{\\imagewidth}\n"
@"\\newlength{\\imagescale}\n"
@"\n"
@"\\begin{document}\n";

static NSString *POSTAMBLE =
@"\n"
@"\\end{document}\n";

@implementation Preambles

+ (Preambles*)preambles {
#if __has_feature(objc_arc)
    return [[self alloc] init];
#else
	return [[[self alloc] init] autorelease];
#endif
}

- (id)init {
	self = [super init];
	if (self) {
		selectedPreambleName = @"default";
		preambleDict = [[NSMutableDictionary alloc] initWithCapacity:1];
		[preambleDict setObject:[self defaultPreamble] forKey:@"custom"];
		styles = nil;
		edges = nil;
		styleManager = nil;
	}
	return self;
}

- (void)dealloc {
#if ! __has_feature(objc_arc)
	[selectedPreambleName release];
	[styles release];
	[styleManager release];
	[super dealloc];
#endif
}

- (NSString*)preambleForName:(NSString*)name {
	if ([name isEqualToString:@"default"])
		return [self defaultPreamble];
	else
		return [preambleDict objectForKey:name];
}

- (BOOL)setPreamble:(NSString*)content forName:(NSString*)name {
	if ([name isEqualToString:@"default"])
		return NO;
	[preambleDict setObject:content forKey:name];
	return YES;
}

- (void)removeAllPreambles {
	[preambleDict removeAllObjects];
}

- (NSEnumerator*)customPreambleNameEnumerator {
	return [preambleDict keyEnumerator];
}

- (void)setStyles:(NSArray*)sty {
#if ! __has_feature(objc_arc)
	[sty retain];
	[styles release];
#endif
	styles = sty;
}

- (void)setEdges:(NSArray*)edg {
#if ! __has_feature(objc_arc)
	[edg retain];
	[edges release];
#endif
	edges = edg;
}

- (NSString*)styleDefinitions {
	if (styleManager != nil) {
		[self setStyles:[styleManager nodeStyles]];
	}
#if ! __has_feature(objc_arc)
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
#endif
	NSMutableString *buf = [NSMutableString string];
	NSMutableString *colbuf = [NSMutableString string];
	NSMutableSet *colors = [NSMutableSet setWithCapacity:2*[styles count]];
	for (NodeStyle *st in styles) {
		[buf appendFormat:@"%@\n", [st tikz]];
		ColorRGB *fill = [st fillColorRGB];
		ColorRGB *stroke = [st strokeColorRGB];
		if ([fill name] == nil && ![colors containsObject:fill]) {
			[colors addObject:fill];
			[colbuf appendFormat:@"\\definecolor{%@}{rgb}{%.3f,%.3f,%.3f}\n",
			 [fill hexName], [fill redFloat], [fill greenFloat], [fill blueFloat]];
		}
		
		if ([stroke name] == nil && ![colors containsObject:stroke]) {
			[colors addObject:stroke];
			[colbuf appendFormat:@"\\definecolor{%@}{rgb}{%.3f,%.3f,%.3f}\n",
			 [stroke hexName], [stroke redFloat], [stroke greenFloat], [stroke blueFloat]];
		}
	}
    
	if (styleManager != nil) {
		[self setEdges:[styleManager edgeStyles]];
	}
    
	[buf appendString:@"\n"];
	for (EdgeStyle *st in edges) {
		[buf appendFormat:@"%@\n", [st tikz]];
		ColorRGB *color = [st colorRGB];
		if (color != nil && [color name] == nil && ![colors containsObject:color]) {
			[colors addObject:color];
			[colbuf appendFormat:@"\\definecolor{%@}{rgb}{%.3f,%.3f,%.3f}\n",
				[color hexName], [color redFloat], [color greenFloat], [color blueFloat]];
		}
	}
	
	NSString *defs = [[NSString alloc] initWithFormat:@"%@\n%@", colbuf, buf];
	
#if __has_feature(objc_arc)
    return defs;
#else
	[pool drain];
	return [defs autorelease];
#endif
}

- (NSString*)defaultPreamble {
	return [NSString stringWithFormat:@"%@%@",
			DEF_PREAMBLE_START, [self styleDefinitions]];
}

- (BOOL)selectedPreambleIsDefault {
	return [selectedPreambleName isEqualToString:@"default"];
}

- (NSString*)selectedPreambleName { return selectedPreambleName; }
- (void)setSelectedPreambleName:(NSString *)sel {
	if (sel != selectedPreambleName) {
#if ! __has_feature(objc_arc)
		[selectedPreambleName release];
#endif
		selectedPreambleName = [sel copy];
	}
}

- (NSString*)currentPreamble {
	NSString *pre = [self preambleForName:selectedPreambleName];
	return (pre == nil) ? [self defaultPreamble] : pre;
}

- (void)setCurrentPreamble:(NSString*)str {
	if (![selectedPreambleName isEqualToString:@"default"])
		[preambleDict setObject:str forKey:selectedPreambleName];
}

- (StyleManager*)styleManager {
	return styleManager;
}

- (void)setStyleManager:(StyleManager *)manager {
#if ! __has_feature(objc_arc)
	[manager retain];
	[styleManager release];
#endif
	styleManager = manager;
}

- (NSString*)currentPostamble {
	return POSTAMBLE;
}

- (NSMutableDictionary*)preambleDict {
	return preambleDict;
}

- (NSString*)defaultPreambleName {
	return @"default";
}

- (NSString*)addPreamble {
	return [self addPreambleWithNameBase:@"new preamble"];
}

- (NSString*)addPreambleWithNameBase:(NSString*)base {
	if ([preambleDict objectForKey:base] == nil) {
		[self setPreamble:[self defaultPreamble] forName:base];
		return base;
	}
	int i = 0;
	NSString *tryName = nil;
	do {
		++i;
		tryName = [NSString stringWithFormat:@"%@ %d", base, i];
	} while ([preambleDict objectForKey:tryName] != nil);

	[self setPreamble:[self defaultPreamble] forName:tryName];
	return tryName;
}

- (BOOL)renamePreambleFrom:(NSString*)old to:(NSString*)new {
	if ([old isEqualToString:@"default"])
		return NO;
	if ([new isEqualToString:@"default"])
		return NO;
	if ([old isEqualToString:new])
		return YES;
	BOOL isSelected = NO;
	if ([old isEqualToString:selectedPreambleName]) {
		[self setSelectedPreambleName:nil];
		isSelected = YES;
	}
	NSString *preamble = [preambleDict objectForKey:old];
#if ! __has_feature(objc_arc)
	[preamble retain];
#endif
	[preambleDict removeObjectForKey:old];
	[preambleDict setObject:preamble forKey:new];
#if ! __has_feature(objc_arc)
	[preamble release];
#endif
	if (isSelected) {
		[self setSelectedPreambleName:new];
	}
	return YES;
}

- (BOOL)removePreamble:(NSString*)name {
	if ([name isEqualToString:@"default"])
		return NO;
	// "name" may be held only by being the selected preamble...
#if ! __has_feature(objc_arc)
	[name retain];
#endif
	if ([name isEqualToString:selectedPreambleName])
		[self setSelectedPreambleName:nil];
	[preambleDict removeObjectForKey:name];
#if ! __has_feature(objc_arc)
	[name release];
#endif
	return YES;
}

- (NSString*)buildDocumentForTikz:(NSString*)tikz
{
	NSString *preamble = [self currentPreamble];
	NSString *doc_head = @"";
	if (![preamble hasPrefix:@"\\documentclass"]) {
		doc_head = @"\\documentclass{article}\n";
	}
	NSString *preamble_suffix = @"";
	if ([preamble rangeOfString:@"\\begin{document}"
						options:NSBackwardsSearch].length == 0) {
		preamble_suffix = PREAMBLE_TAIL;
	}
    return [NSString stringWithFormat:@"%@%@%@%@%@",
			 doc_head,
             [self currentPreamble],
			 preamble_suffix,
             tikz,
             POSTAMBLE];
}

- (NSString*)buildDocumentForGraph:(Graph*)g
{
	return [self buildDocumentForTikz:[g tikz]];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
