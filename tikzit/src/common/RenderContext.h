/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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
#import "RColor.h"

typedef enum {
    AntialiasDisabled,
    AntialiasDefault
} AntialiasMode;

// encapsulates a CTLine on OSX and
// a PangoLayout in GTK+
@protocol TextLayout
@property (readonly) NSSize size;
@property (readonly) NSString *text;
- (void) showTextAt:(NSPoint)topLeft withColor:(RColor)color;
@end

@protocol RenderContext
- (void) saveState;
- (void) restoreState;

- (NSRect) clipBoundingBox;
- (BOOL) strokeIncludesPoint:(NSPoint)p;
- (BOOL) fillIncludesPoint:(NSPoint)p;
- (id<TextLayout>) layoutText:(NSString*)text withSize:(CGFloat)fontSize;

// this may not affect text rendering
- (void) setAntialiasMode:(AntialiasMode)mode;
- (void) setLineWidth:(CGFloat)width;
// setting to 0 will unset the dash
- (void) setLineDash:(CGFloat)dashLength;

/**
 * Clear the current path, including all subpaths
 */
- (void) startPath;
/**
 * Close the current subpath
 */
- (void) closeSubPath;
/**
 * Start a new subpath, and set the current point.
 *
 * The point will be the current point and the starting point
 * for the subpath.
 */
- (void) moveTo:(NSPoint)p;
/**
 * Add a cubic bezier curve to the current subpath.
 *
 * The curve will start at the current point, terminate at end and
 * be defined by cp1 and cp2.
 */
- (void) curveTo:(NSPoint)end withCp1:(NSPoint)cp1 andCp2:(NSPoint)cp2;
/**
 * Add a straight line to the current subpath.
 *
 * The line will start at the current point, and terminate at end.
 */
- (void) lineTo:(NSPoint)end;
/**
 * Add a new rectangular subpath.
 *
 * The current point is undefined after this call.
 */
- (void) rect:(NSRect)rect;
/**
 * Add a new circular subpath.
 *
 * The current point is undefined after this call.
 */
- (void) circleAt:(NSPoint)c withRadius:(CGFloat)r;

/**
 * Paint along the current path.
 *
 * The current line width and dash style will be used,
 * and the colour is given by color.
 *
 * The path will be cleared by this call, as though
 * startPath had been called.
 */
- (void) strokePathWithColor:(RColor)color;
/**
 * Paint inside the current path.
 *
 * The fill colour is given by color.
 *
 * The path will be cleared by this call, as though
 * startPath had been called.
 */
- (void) fillPathWithColor:(RColor)color;
/**
 * Paint along and inside the current path.
 *
 * The current line width and dash style will be used,
 * and the colour is given by color.
 *
 * The path will be cleared by this call, as though
 * startPath had been called.
 *
 * Note that the fill and stroke may overlap, although
 * the stroke is always painted on top, so this is only
 * relevant when the stroke colour has an alpha channel
 * other than 1.0f.
 */
- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor;
/**
 * Paint along and inside the current path using an alpha channel.
 *
 * The current line width and dash style will be used,
 * and the colour is given by color.
 *
 * The path will be cleared by this call, as though
 * startPath had been called.
 *
 * Note that the fill and stroke may overlap, although
 * the stroke is always painted on top, so this is only
 * relevant when the stroke colour has an alpha channel
 * other than 1.0f.
 */
- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor
                  usingAlpha:(CGFloat)alpha;
/**
 * Set the clip to the current path.
 *
 * The path will be cleared by this call, as though
 * startPath had been called.
 */
- (void) clipToPath;

/**
 * Paint everywhere within the clip.
 */
- (void) paintWithColor:(RColor)color;
@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
