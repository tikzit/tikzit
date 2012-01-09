//
//  Grid.m
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

#import "Grid.h"


@implementation Grid

@synthesize size;

- (id)initWithSpacing:(float)spacing
		 subdivisions:(int)subs
		  transformer:(Transformer*)t
{
	[super init];
	gridX = spacing;
	gridY = spacing;
	subdivisions = subs;
	size.width = 0;
	size.height = 0;
	transformer = t;
	return self;
}

+ (Grid*)gridWithSpacing:(float)spacing
			subdivisions:(int)subs
			 transformer:(Transformer*)t
{
	return [[Grid alloc] initWithSpacing:spacing
							subdivisions:subs
							 transformer:t];
}

- (float)gridX {
	return gridX;
}

- (float)gridY {
	return gridY;
}

- (int)subdivisions {
	return subdivisions;
}

- (void)setSubdivisions:(int)subs {
	subdivisions = subs;
}

- (NSPoint)snapScreenPoint:(NSPoint)p {
	NSPoint snap;
	
	float gridCellX = [transformer scaleToScreen:gridX] / (float)subdivisions;
	float gridCellY = [transformer scaleToScreen:gridY] / (float)subdivisions;
	
	// snap along grid lines, relative to the origin
	snap.x = floor(((p.x-[transformer origin].x)/gridCellX)+0.5)*gridCellX + [transformer origin].x;
	snap.y = floor(((p.y-[transformer origin].y)/gridCellY)+0.5)*gridCellY + [transformer origin].y;
	return snap;
}

-(void)drawLayer:(CALayer *)layer inContext:(CGContextRef)context
{
	CGContextSaveGState(context);
	
	CGContextSetShouldAntialias(context, NO);
	
	float x,y;
	float grX = [transformer scaleToScreen:gridX];
	float grY = [transformer scaleToScreen:gridY];
	
	float gridCellX = grX / (float)subdivisions;
	float gridCellY = grY / (float)subdivisions;
	
    for (x = [transformer origin].x + gridCellX; x < size.width; x += gridCellX) {
        CGContextMoveToPoint(context, x, 0);
        CGContextAddLineToPoint(context, x, size.height);
    }
    
    for (x = [transformer origin].x - gridCellX; x > 0; x -= gridCellX) {
        CGContextMoveToPoint(context, x, 0);
        CGContextAddLineToPoint(context, x, size.height);
    }
    
    for (y = [transformer origin].y + gridCellY; y < size.height; y += gridCellY) {
        CGContextMoveToPoint(context, 0, y);
        CGContextAddLineToPoint(context, size.width, y);
    }
    
    for (y = [transformer origin].y - gridCellY; y > 0; y -= gridCellY) {
        CGContextMoveToPoint(context, 0, y);
        CGContextAddLineToPoint(context, size.width, y);
    }
    
    CGContextSetRGBStrokeColor(context, 0.9, 0.9, 1, 1);
    CGContextStrokePath(context);
    
    for (x = [transformer origin].x + grX; x < size.width; x += grX) {
        CGContextMoveToPoint(context, x, 0);
        CGContextAddLineToPoint(context, x, size.height);
    }
    
    for (x = [transformer origin].x - grX; x > 0; x -= grX) {
        CGContextMoveToPoint(context, x, 0);
        CGContextAddLineToPoint(context, x, size.height);
    }
    
    for (y = [transformer origin].y + grY; y < size.height; y += grY) {
        CGContextMoveToPoint(context, 0, y);
        CGContextAddLineToPoint(context, size.width, y);
    }
    
    for (y = [transformer origin].y + grY; y > 0; y -= grY) {
        CGContextMoveToPoint(context, 0, y);
        CGContextAddLineToPoint(context, size.width, y);
    }
    
    CGContextSetRGBStrokeColor(context, 0.8, 0.8, 0.9, 1);
    CGContextStrokePath(context);
    
    CGContextMoveToPoint(context, [transformer origin].x, 0);
    CGContextAddLineToPoint(context, [transformer origin].x, size.height);
    CGContextMoveToPoint(context, 0, [transformer origin].y);
    CGContextAddLineToPoint(context, size.width, [transformer origin].y);
    
    CGContextSetRGBStrokeColor(context, 0.6, 0.6, 0.7, 1);
    CGContextStrokePath(context);
	
	CGContextRestoreGState(context);
}

@end
