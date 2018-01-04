//
//  NodeStyle+Coder.m
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

#import "NodeStyle+Coder.h"
#import "ShapeNames.h"

@implementation NodeStyle(Coder)

- (NSColor*)fillColor {
	return [NSColor colorWithDeviceRed:fillColorRGB.redFloat
								 green:fillColorRGB.greenFloat
								  blue:fillColorRGB.blueFloat
								 alpha:1.0f];
}

- (void)setFillColor:(NSColor*)c {
	NSColor *c1 = [c colorUsingColorSpaceName:NSDeviceRGBColorSpace];
	[self willChangeValueForKey:@"fillColorIsKnown"];
	fillColorRGB = [ColorRGB colorWithFloatRed:c1.redComponent
										 green:c1.greenComponent
										  blue:c1.blueComponent];
	[self didChangeValueForKey:@"fillColorIsKnown"];
}

- (NSColor*)strokeColor {
	return [NSColor colorWithDeviceRed:strokeColorRGB.redFloat
								 green:strokeColorRGB.greenFloat
								  blue:strokeColorRGB.blueFloat
								 alpha:1.0f];
}

- (void)setStrokeColor:(NSColor*)c {
	NSColor *c1 = [c colorUsingColorSpaceName:NSDeviceRGBColorSpace];
	[self willChangeValueForKey:@"strokeColorIsKnown"];
	strokeColorRGB = [ColorRGB colorWithFloatRed:c1.redComponent
										   green:c1.greenComponent
											blue:c1.blueComponent];
	[self didChangeValueForKey:@"strokeColorIsKnown"];
}

- (id)initWithCoder:(NSCoder *)coder {
	if (!(self = [super init])) return nil;
	
	// decode keys
	name = [coder decodeObjectForKey:@"name"];
	[self setStrokeColor:[coder decodeObjectForKey:@"strokeColor"]];
	[self setFillColor:[coder decodeObjectForKey:@"fillColor"]];
	strokeThickness = [coder decodeIntForKey:@"strokeThickness"];
	shapeName = [coder decodeObjectForKey:@"shapeName"];
	category = [coder decodeObjectForKey:@"category"];
	scale = [coder decodeFloatForKey:@"scale"];
	
	// apply defaults
	if (scale == 0.0f) scale = 1.0f;
	if (shapeName == nil) shapeName = SHAPE_CIRCLE;
	
	return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
	[coder encodeObject:name forKey:@"name"];
	[coder encodeObject:[self strokeColor] forKey:@"strokeColor"];
	[coder encodeObject:[self fillColor] forKey:@"fillColor"];
	[coder encodeInt:strokeThickness forKey:@"strokeThickness"];
	[coder encodeObject:shapeName forKey:@"shapeName"];
	[coder encodeObject:category forKey:@"category"];
	[coder encodeFloat:scale forKey:@"scale"];
}


@end
