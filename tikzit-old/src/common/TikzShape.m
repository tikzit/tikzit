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
#import "Graph.h"

@implementation TikzShape

@synthesize tikzSrc;

- (id)initWithTikzFile:(NSString*)file {
	self = [super init];
	if (self) {
		NSString *tikz = [NSString stringWithContentsOfFile:file
												   encoding:NSUTF8StringEncoding
													  error:NULL];
		if (tikz == nil) return nil;
        
        tikzSrc = [tikz copy];
		
		Graph *graph = [Graph graphFromTikz:tikz];
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
#if __has_feature(objc_arc)
        paths = [graph pathCover];
#else
		paths = [[graph pathCover] retain];
#endif
	}
	return self;
}


@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
