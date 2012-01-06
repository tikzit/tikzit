/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
 * Copyright 2010  Chris Heunen
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#import "Grid.h"
#import "util.h"

@implementation Grid

+ (Grid*) gridWithSpacing:(float)sp subdivisions:(int)subs transformer:(Transformer*)t {
	return [[[self alloc] initWithSpacing:sp subdivisions:subs transformer:t] autorelease];
}

- (id) initWithSpacing:(float)sp subdivisions:(int)subs transformer:(Transformer*)t {
	self = [super init];

	if (self) {
		transformer = [t retain];
		spacing = sp;
		cellSubdivisions = subs;
	}

	return self;
}

- (int) cellSubdivisions {
	return cellSubdivisions;
}

- (void) setCellSubdivisions:(int)count {
	cellSubdivisions = count;
}

- (float) cellSpacing {
	return spacing;
}

- (void) setCellSpacing:(float)sp {
	spacing = sp;
}

- (NSPoint) snapScreenPoint:(NSPoint)point {
	NSPoint gridPoint = [transformer fromScreen:point];
	return [transformer toScreen:[self snapPoint:gridPoint]];
}

- (NSPoint) snapPoint:(NSPoint)p {
	const float snapDistance = spacing/(float)cellSubdivisions;
	p.x = roundToNearest (snapDistance, p.x);
	p.y = roundToNearest (snapDistance, p.y);
	return p;
}

- (void) _setupLinesForContext:(id<RenderContext>)context withSpacing:(float)offset omittingEvery:(int)omitEvery origin:(NSPoint)origin {
	NSRect clip = [context clipBoundingBox];
	float clipx1 = clip.origin.x;
	float clipx2 = clipx1 + clip.size.width;
	float clipy1 = clip.origin.y;
	float clipy2 = clipy1 + clip.size.height;

	// left of the Y axis, moving outwards
	unsigned int count = 1;
	float x = origin.x - offset;
	while (x >= clipx1) {
		if (omitEvery == 0 || (count % omitEvery != 0)) {
			[context moveTo:NSMakePoint(x, clipy1)];
			[context lineTo:NSMakePoint(x, clipy2)];
		}

		x -= offset;
		++count;
	}
	// right of the Y axis, moving outwards
	count = 1;
	x = origin.x + offset;
	while (x <= clipx2) {
		if (omitEvery == 0 || (count % omitEvery != 0)) {
			[context moveTo:NSMakePoint(x, clipy1)];
			[context lineTo:NSMakePoint(x, clipy2)];
		}

		x += offset;
		++count;
	}

	// above the Y axis, moving outwards
	count = 1;
	float y = origin.y - offset;
	while (y >= clipy1) {
		if (omitEvery == 0 || (count % omitEvery != 0)) {
			[context moveTo:NSMakePoint(clipx1, y)];
			[context lineTo:NSMakePoint(clipx2, y)];
		}

		y -= offset;
		++count;
	}
	// below the Y axis, moving outwards
	count = 1;
	y = origin.y + offset;
	while (y <= clipy2) {
		if (omitEvery == 0 || (count % omitEvery != 0)) {
			[context moveTo:NSMakePoint(clipx1, y)];
			[context lineTo:NSMakePoint(clipx2, y)];
		}

		y += offset;
		++count;
	}
}

- (void) _renderSubdivisionsWithContext:(id<RenderContext>)context origin:(NSPoint)origin cellSize:(float)cellSize {
	const float offset = cellSize / cellSubdivisions;

	[self _setupLinesForContext:context withSpacing:offset omittingEvery:cellSubdivisions origin:origin];

	[context strokePathWithColor:MakeSolidRColor (0.9, 0.9, 1.0)];
}

- (void) _renderCellsWithContext:(id<RenderContext>)context origin:(NSPoint)origin cellSize:(float)cellSize {
	[self _setupLinesForContext:context withSpacing:cellSize omittingEvery:0 origin:origin];

	[context strokePathWithColor:MakeSolidRColor (0.8, 0.8, 0.9)];
}

- (void) _renderAxesWithContext:(id<RenderContext>)context origin:(NSPoint)origin {
	NSRect clip = [context clipBoundingBox];

	[context moveTo:NSMakePoint(origin.x, clip.origin.y)];
	[context lineTo:NSMakePoint(origin.x, clip.origin.y + clip.size.height)];
	[context moveTo:NSMakePoint(clip.origin.x, origin.y)];
	[context lineTo:NSMakePoint(clip.origin.x + clip.size.width, origin.y)];

	[context strokePathWithColor:MakeSolidRColor (0.6, 0.6, 0.7)];
}

- (void) renderGridInContext:(id<RenderContext>)cr {
	[self renderGridInContext:cr transformer:transformer];
}

- (void) renderGridInContext:(id<RenderContext>)context transformer:(Transformer*)t {
	const NSPoint origin = [t toScreen:NSZeroPoint];
	const float cellSize = [t scaleToScreen:spacing];
    
	[context saveState];
    
	// common line settings
	[context setLineWidth:1.0];
	[context setAntialiasMode:AntialiasDisabled];
    
	[self _renderSubdivisionsWithContext:context origin:origin cellSize:cellSize];
	[self _renderCellsWithContext:context origin:origin cellSize:cellSize];
	[self _renderAxesWithContext:context origin:origin];
    
	[context restoreState];
}

- (void) dealloc {
	[transformer release];
	[super dealloc];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
