//
//  TikzShape.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger. All rights reserved.
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

#import "TikzShape.h"
#import "TikzGraphAssembler.h"
#import "Graph.h"

NSString *defaultTikz =
@"\\begin{tikzpicture}\n"
@"	\\begin{pgfonlayer}{nodelayer}\n"
@"		\\node [style=none] (0) at (-0.5, 1) {};\n"
@"		\\node [style=none] (1) at (0.5, 1) {};\n"
@"		\\node [style=none] (2) at (-1.5, -1) {};\n"
@"		\\node [style=none] (3) at (-0.5, -1) {};\n"
@"		\\node [style=none] (4) at (0.5, -1) {};\n"
@"		\\node [style=none] (5) at (1.5, -1) {};\n"
@"	\\end{pgfonlayer}\n"
@"	\\begin{pgfonlayer}{edgelayer}\n"
@"		\\draw (3.center) to (2.center);\n"
@"		\\draw [in=90, out=90, looseness=2.00] (4.center) to (3.center);\n"
@"		\\draw (5.center) to (4.center);\n"
@"		\\draw [in=270, out=90, looseness=0.75] (2.center) to (0.center);\n"
@"		\\draw [in=90, out=-90, looseness=0.75] (1.center) to (5.center);\n"
@"		\\draw (0.center) to (1.center);\n"
@"	\\end{pgfonlayer}\n"
@"\\end{tikzpicture}\n";

@implementation TikzShape

- (id)initWithTikzFile:(NSString*)file {
	[super init];
	
	NSString *tikz = [NSString stringWithContentsOfFile:file
											   encoding:NSUTF8StringEncoding
												  error:NULL];
	if (tikz == nil) return nil;
	
	TikzGraphAssembler *ass = [[TikzGraphAssembler alloc] init];
	[ass parseTikz:tikz];
	
	Graph *graph = [ass graph];
    [ass release];
	if (graph == nil) return nil;
	
	NSRect graphBounds = ([graph hasBoundingBox]) ? [graph boundingBox] : [graph bounds];
	
	float sz = 0.5f;
	
	// the "screen" coordinate space fits in the shape bounds
	Transformer *t = [Transformer transformer];
	float width_ratio = (2*sz) / graphBounds.size.width;
	float height_ratio = (2*sz) / graphBounds.size.height;
	[t setScale:MIN(width_ratio, height_ratio)];
	NSRect bds = [t rectToScreen:graphBounds];
	NSPoint shift = NSMakePoint(-NSMidX(bds),
								-NSMidY(bds));
	[t setOrigin:shift];
	[graph applyTransformer:t];
	paths = [[graph pathCover] retain];
	
	return self;
}


@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
