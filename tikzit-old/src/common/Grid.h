/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
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

#import <Foundation/Foundation.h>
#import "RenderContext.h"
#import "Transformer.h"

/*!
 * Provides a grid, which can be use for snapping points
 *
 * The grid is divided into cells, and each cell is further subdivided.
 * These subdivisions are the snap points for the grid.
 */
@interface Grid: NSObject <NSCopying> {
	Transformer *transformer;
	float spacing;
	int cellSubdivisions;
}

/*!
 * The number of times to subdivide the edge of each cell
 *
 * Each cell will be divided into cellSubdivisions^2 squares.
 */
@property (assign) int cellSubdivisions;

/*!
 * The cell spacing
 *
 * Each cell will be @p cellSpacing wide and @p cellSpacing high.
 */
@property (assign) float cellSpacing;


/*!
 * Create a new grid object.
 *
 * @param sp    the cell spacing - this will be the width and height of each cell
 * @param subs  the number of cell subdivisions; the cell will end up being
 *              divided into subs*subs squares that are each sp/subs wide and high
 * @param t     the transformer to be used when snapping screen points
 */
+ (Grid*) gridWithSpacing:(float)sp subdivisions:(int)subs transformer:(Transformer*)t;
/*!
 * Initialize a grid object.
 *
 * @param sp    the cell spacing - this will be the width and height of each cell
 * @param subs  the number of cell subdivisions; each cell will end up being
 *              divided into subs*subs squares that are each sp/subs wide and high
 * @param t     the transformer to be used when snapping screen points
 */
- (id) initWithSpacing:(float)sp subdivisions:(int)subs transformer:(Transformer*)t;

/*!
 * Snap a point in screen co-ordinates
 *
 * @param p  the point to snap, in screen co-ordinates
 * @result   @p p aligned to the nearest corner of a cell subdivision
 */
- (NSPoint) snapScreenPoint:(NSPoint)p;
/*!
 * Snap a point in base co-ordinates
 *
 * @param p  the point to snap
 * @result   @p p aligned to the nearest corner of a cell subdivision
 */
- (NSPoint) snapPoint:(NSPoint)p;

/**
 * Renders the grid
 *
 * The grid is rendered across the entire surface (subject to the context's
 * clip).
 *
 * The internal transformer is used to convert between graph co-ordinates
 * and graphics co-ordinates.
 *
 * @param cr  the context to render in
 */
- (void) renderGridInContext:(id<RenderContext>)cr;

/**
 * Renders the grid
 *
 * The grid is rendered across the entire surface (subject to the context's
 * clip).
 *
 * @param cr  the context to render in
 * @param t   a transformer that will be used to map graph co-ordinates
 *            to graphics co-ordinates
 */
- (void) renderGridInContext:(id<RenderContext>)cr transformer:(Transformer*)t;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
