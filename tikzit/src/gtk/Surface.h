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

#import "TZFoundation.h"
#import "RenderContext.h"
#import "Transformer.h"

@protocol Surface;

@protocol RenderDelegate
- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface;
@end

/**
 * Represents a surface that can be rendered to
 *
 * This protocol should be implemented by drawing surfaces.  It
 * provides geometry information and methods to invalidate
 * regions of the surface, triggering a redraw.
 *
 * The surface should send a "SurfaceSizeChanged" notification
 * when the width or height changes.
 */
@protocol Surface

/**
 * The width of the surface, in surface units
 *
 * The surface should send a "SurfaceSizeChanged" notification
 * when this property changes.
 */
@property (readonly) int width;
/**
 * The height of the surface, in surface units
 *
 * The surface should send a "SurfaceSizeChanged" notification
 * when this property changes.
 */
@property (readonly) int height;
/**
 * The transformer that converts between graph units and surface units
 */
@property (readonly) Transformer *transformer;
/**
 * The render delegate.
 *
 * This will be used to redraw (parts of) the surface when necessary.
 */
@property (assign) id<RenderDelegate> renderDelegate;

/**
 * Create a render context for the surface.
 */
- (id<RenderContext>) createRenderContext;
/**
 * Invalidate a portion of the surface.
 *
 * This will request that part of the surface be redrawn.
 */
- (void) invalidateRect:(NSRect)rect;
/**
 * Invalidate the whole surface.
 *
 * This will request that the whole surface be redrawn.
 */
- (void) invalidate;

- (void) zoomIn;
- (void) zoomOut;
- (void) zoomReset;
- (void) zoomInAboutPoint:(NSPoint)p;
- (void) zoomOutAboutPoint:(NSPoint)p;
- (void) zoomResetAboutPoint:(NSPoint)p;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
