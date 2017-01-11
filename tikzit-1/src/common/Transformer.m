//
//  Transformer.m
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

#import "Transformer.h"

float const PIXELS_PER_UNIT = 50;

@implementation Transformer

+ (Transformer*)transformer {
#if __has_feature(objc_arc)
    return [[Transformer alloc] init];
#else
    return [[[Transformer alloc] init] autorelease];
#endif
}

+ (Transformer*)transformerWithTransformer:(Transformer*)t {
#if __has_feature(objc_arc)
    return [t copy];
#else
    return [[t copy] autorelease];
#endif
}

+ (Transformer*)transformerWithOrigin:(NSPoint)o andScale:(float)scale {
	Transformer *trans = [self transformer];
	[trans setOrigin:o];
	[trans setScale:scale];
	return trans;
}

+ (Transformer*)transformerToFit:(NSRect)graphRect
		  intoScreenRect:(NSRect)screenRect {
	return [self transformerToFit:graphRect
		       intoScreenRect:screenRect
		    flippedAboutXAxis:NO
		    flippedAboutYAxis:NO];
}

+ (Transformer*)transformerToFit:(NSRect)graphRect
		  intoScreenRect:(NSRect)screenRect
	       flippedAboutXAxis:(BOOL)flipX {
	return [self transformerToFit:graphRect
		       intoScreenRect:screenRect
		    flippedAboutXAxis:flipX
		    flippedAboutYAxis:NO];
}

+ (Transformer*)transformerToFit:(NSRect)graphRect
		  intoScreenRect:(NSRect)screenRect
	       flippedAboutYAxis:(BOOL)flipY {
	return [self transformerToFit:graphRect
		       intoScreenRect:screenRect
		    flippedAboutXAxis:NO
		    flippedAboutYAxis:flipY];
}

+ (Transformer*)transformerToFit:(NSRect)graphRect
		  intoScreenRect:(NSRect)screenRect
	       flippedAboutXAxis:(BOOL)flipAboutXAxis
	       flippedAboutYAxis:(BOOL)flipAboutYAxis {

	const float wscale = screenRect.size.width / graphRect.size.width;
	const float hscale = screenRect.size.height / graphRect.size.height;
	const float scale = (wscale < hscale) ? wscale : hscale;
	const float xpad = (screenRect.size.width - (graphRect.size.width * scale)) / 2.0;
	const float ypad = (screenRect.size.height - (graphRect.size.height * scale)) / 2.0;

	// if we are flipping, we need to calculate the origin from the opposite edge
	const float gx = flipAboutYAxis ? -(graphRect.size.width + graphRect.origin.x)
					: graphRect.origin.x;
	const float gy = flipAboutXAxis ? -(graphRect.size.height + graphRect.origin.y)
					: graphRect.origin.y;
	const float origin_x = screenRect.origin.x - (gx * scale) + xpad;
	const float origin_y = screenRect.origin.y - (gy * scale) + ypad;

	Transformer *trans = [self transformer];
	[trans setOrigin:NSMakePoint(origin_x, origin_y)];
	[trans setScale:scale];
	[trans setFlippedAboutXAxis:flipAboutXAxis];
	[trans setFlippedAboutYAxis:flipAboutYAxis];
	return trans;
}

- (id) init {
	self = [super init];

	if (self) {
		origin = NSZeroPoint;
		x_scale = 1.0f;
		y_scale = 1.0f;
	}

	return self;
}

- (id)copyWithZone:(NSZone *)zone {
	Transformer *cp = [[[self class] allocWithZone:zone] init];
	if (cp) {
		cp->origin = origin;
		cp->x_scale = x_scale;
		cp->y_scale = y_scale;
	}
	return cp;
}

- (NSPoint)origin { return origin; }
- (void)setOrigin:(NSPoint)o {
	origin = o;
}

- (float)scale { return ABS(x_scale); }
- (void)setScale:(float)s {
	x_scale = (x_scale < 0.0) ? -s : s;
	y_scale = (y_scale < 0.0) ? -s : s;
}

- (BOOL)isFlippedAboutXAxis {
	return y_scale < 0.0;
}

- (void)setFlippedAboutXAxis:(BOOL)flip {
	if (flip != [self isFlippedAboutXAxis]) {
		y_scale *= -1;
	}
}

- (BOOL)isFlippedAboutYAxis {
	return x_scale < 0.0;
}

- (void)setFlippedAboutYAxis:(BOOL)flip {
	if (flip != [self isFlippedAboutYAxis]) {
		x_scale *= -1;
	}
}

- (NSPoint)fromScreen:(NSPoint)p {
	NSPoint trans;
	trans.x = (p.x - origin.x) / x_scale;
	trans.y = (p.y - origin.y) / y_scale;
	return trans;
}

- (NSPoint)toScreen:(NSPoint)p {
	NSPoint trans;
	trans.x = (p.x * x_scale) + origin.x;
	trans.y = (p.y * y_scale) + origin.y;
	return trans;
}

- (float)scaleFromScreen:(float)dist {
	return dist / ABS(x_scale);
}

- (float)scaleToScreen:(float)dist {
	return dist * ABS(x_scale);
}

- (NSRect)rectFromScreen:(NSRect)r {
	NSRect r1;
	r1.origin = [self fromScreen:r.origin];
	r1.size.width = [self scaleFromScreen:r.size.width];
	r1.size.height = [self scaleFromScreen:r.size.height];
	// if we're flipped, the origin will be at a different corner
	if ([self isFlippedAboutYAxis]) {
		r1.origin.x -= r1.size.width;
	}
	if ([self isFlippedAboutXAxis]) {
		r1.origin.y -= r1.size.height;
	}
	return r1;
}

- (NSRect)rectToScreen:(NSRect)r {
	NSPoint o = r.origin;
	// if we're flipped, the origin will be at a different corner
	if ([self isFlippedAboutYAxis]) {
		o.x = NSMaxX(r);
	}
	if ([self isFlippedAboutXAxis]) {
		o.y = NSMaxY(r);
	}
	NSRect r1;
	r1.origin = [self toScreen:o];
	r1.size.width = [self scaleToScreen:r.size.width];
	r1.size.height = [self scaleToScreen:r.size.height];
	return r1;
}

- (BOOL)isEqual:(id)object {
    Transformer *t = (Transformer*)object;
    return ([t origin].x == [self origin].x &&
            [t origin].y == [self origin].y &&
            [t scale]    == [self scale]);
}

Transformer *defaultTransformer = nil;

+ (Transformer*)defaultTransformer {
	if (defaultTransformer == nil) {
		defaultTransformer = [[Transformer alloc] init];
		[defaultTransformer setScale:PIXELS_PER_UNIT];
	}
	return defaultTransformer;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
