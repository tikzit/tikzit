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

#import "Shape+Render.h"

#import "Edge.h"

// we use cairo for finding the bounding box etc.
#import <cairo/cairo.h>

@implementation Shape (Render)

- (void) drawPathWithTransform:(Transformer*)transform andContext:(id<RenderContext>)context {
    [context startPath];

    for (NSArray *arr in [self paths]) {
        BOOL fst = YES;
        NSPoint p, cp1, cp2;

        for (Edge *e in arr) {
            if (fst) {
                fst = NO;
                p = [transform toScreen:[[e source] point]];
                [context moveTo:p];
            }

            p = [transform toScreen:[[e target] point]];
            if ([e isStraight]) {
                [context lineTo:p];
            } else {
                cp1 = [transform toScreen:[e cp1]];
                cp2 = [transform toScreen:[e cp2]];
                [context curveTo:p withCp1:cp1 andCp2:cp2];
            }
        }

        [context closeSubPath];
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
