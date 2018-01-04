//
//  Grid.h
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
#import "Transformer.h"

@interface Grid : NSObject {
	float gridX, gridY;
	//float gridCellX, gridCellY;
	int subdivisions;
	Transformer *transformer;
	NSSize size;
}

@property NSSize size;

- (id)initWithSpacing:(float)spacing subdivisions:(int)subs transformer:(Transformer*)t;
+ (Grid*)gridWithSpacing:(float)spacing subdivisions:(int)subs transformer:(Transformer*)t;
- (NSPoint)snapScreenPoint:(NSPoint)p;
- (float)gridX;
- (float)gridY;
- (int)subdivisions;
- (void)setSubdivisions:(int)subs;

// Grid can also draw itself on a layer
- (void)drawLayer:(CALayer *)layer inContext:(CGContextRef)ctx;

@end
