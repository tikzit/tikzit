//
//  NodeSelectionLayer.m
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

#import "NodeSelectionLayer.h"
#import "NodeLayer.h"
#import "CircleShape.h"

@implementation NodeSelectionLayer

@synthesize nodeLayer;

- (id)init {
	if (!(self = [super init])) return nil;
	selected = NO;
    drawLock = [[NSLock alloc] init];
    nodeLayer = nil;
	[self setOpacity:0.0f];
	return self;
}


- (void)select {
	selected = YES;
	[self setOpacity:0.5f];
}

- (void)deselect {
	selected = NO;
	[self setOpacity:0.0f];
}

- (void)highlight {
	if (!selected) {
		[self setOpacity:0.25f];
	}
}

- (void)unhighlight {
	if (!selected) {
		[self setOpacity:0.0f];
	}
}

//- (CGMutablePathRef)path {
//    return path;
//}
//
//- (void)setPath:(CGMutablePathRef)p {
//    path = CGPathCreateMutableCopy(p);
//    CFMakeCollectable(path);
//}

- (void)drawInContext:(CGContextRef)context {
    [drawLock lock];
	CGContextSaveGState(context);

	//CGContextSetRGBStrokeColor(context, 0.61f, 0.735f, 1.0f, 1.0f);
	CGContextSetRGBStrokeColor(context, 0.61f, 0.735f, 1.0f, 1.0f);
	CGContextSetRGBFillColor(context, 0.61f, 0.735f, 1.0f, 1.0f);
	CGContextSetLineWidth(context, 6.0f);
	
    if (nodeLayer != nil) {
        CGContextAddPath(context, [nodeLayer path]);
    } else {
        NSLog(@"WARNING: attempting to draw selection with path = nil.");
    }
	CGContextDrawPath(context, kCGPathFillStroke);
	
	CGContextRestoreGState(context);
    [drawLock unlock];
}

@end
