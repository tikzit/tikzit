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

static NSString *PREAMBLE_HEAD =
@"\\documentclass{article}\n"
@"\\usepackage[svgnames]{xcolor}\n"
@"\\usepackage{tikz}\n"
@"\\pagestyle{empty}\n"
@"\n"
@"\\pgfdeclarelayer{edgelayer}\n"
@"\\pgfdeclarelayer{nodelayer}\n"
@"\\pgfsetlayers{edgelayer,nodelayer,main}\n"
@"\n"
@"\\tikzstyle{none}=[inner sep=0pt]\n";

static NSString *PREAMBLE_TAIL =
@"\n"
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
	return [[[self alloc] init] autorelease];
}

- (id)init {
	[super init];
	selectedPreambleName = @"default";
	preambleDict = [[NSMutableDictionary alloc] initWithCapacity:1];
	[preambleDict setObject:[self defaultPreamble] forKey:@"custom"];
	styles = nil;
	styleManager = nil;
	return self;
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
	[sty retain];
	[styles release];
	styles = sty;
}

- (NSString*)styleDefinitions {
	if (styleManager != nil) {
		[self setStyles:[styleManager nodeStyles]];
	}
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NSMutableString *buf = [NSMutableString string];
	NSMutableString *colbuf = [NSMutableString string];
	NSMutableSet *colors = [NSMutableSet setWithCapacity:2*[styles count]];
	for (NodeStyle *st in styles) {
		[buf appendFormat:@"%@", [st tikz]];
		ColorRGB *fill = [st fillColorRGB];
		ColorRGB *stroke = [st strokeColorRGB];
		if ([fill name] == nil && ![colors containsObject:fill]) {
			[colors addObject:fill];
			[colbuf appendFormat:@"\\definecolor{%@}{rgb}{%.3f,%.3f,%.3f}\n",
			 [fill hexName], [fill redFloat], [fill greenFloat], [fill blueFloat]];
		}
		
		if ([fill name] == nil && ![colors containsObject:fill]) {
			[colors addObject:stroke];
			[colbuf appendFormat:@"\\definecolor{%@}{rgb}{%.3f,%.3f,%.3f}\n",
			 [fill hexName], [fill redFloat], [fill greenFloat], [fill blueFloat]];
		}
	}
	
	NSString *defs = [[NSString alloc] initWithFormat:@"%@%@", colbuf, buf];
	
	[pool drain];
	return [defs autorelease];
}

- (NSString*)defaultPreamble {
	return [NSString stringWithFormat:@"%@%@%@",
			PREAMBLE_HEAD, [self styleDefinitions], PREAMBLE_TAIL];
}

- (BOOL)selectedPreambleIsDefault {
	return [selectedPreambleName isEqualToString:@"default"];
}

- (NSString*)selectedPreambleName { return selectedPreambleName; }
- (void)setSelectedPreambleName:(NSString *)sel {
	if (sel != selectedPreambleName) {
		[selectedPreambleName release];
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
	[manager retain];
	[styleManager release];
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

- (BOOL)renamePreambleFrom:(NSString*)old to:(NSString*)new {
	if ([old isEqualToString:@"default"])
		return NO;
	if ([new isEqualToString:@"default"])
		return NO;
	if ([old isEqualToString:new])
		return YES;
	NSString *preamble = [preambleDict objectForKey:old];
	[preamble retain];
	[preambleDict removeObjectForKey:old];
	[preambleDict setObject:preamble forKey:new];
	[preamble release];
	return YES;
}

- (BOOL)removePreamble:(NSString*)name {
	if ([name isEqualToString:@"default"])
		return NO;
	[preambleDict removeObjectForKey:name];
	return YES;
}

- (void)dealloc {
	[selectedPreambleName release];
	[styles release];
	[styleManager release];
	[super dealloc];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
