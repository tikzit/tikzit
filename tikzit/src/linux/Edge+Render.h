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
#import "Edge.h"
#import "RenderContext.h"
#import "Surface.h"

@interface Edge (Render)

+ (float) controlPointRadius;
- (void) renderControlsToSurface:(id<Surface>)surface withContext:(id<RenderContext>)context;
- (void) renderToSurface:(id<Surface>)surface withContext:(id<RenderContext>)context selected:(BOOL)selected;
- (NSRect) renderedBoundsWithTransformer:(Transformer*)t whenSelected:(BOOL)selected;
- (BOOL) hitByPoint:(NSPoint)p onSurface:(id<Surface>)surface withFuzz:(float)fuzz;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
