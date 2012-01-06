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
#import <poppler.h>
#import "Preambles.h"
#import "Surface.h"
#import "TikzDocument.h"

@interface PreviewRenderer: NSObject<RenderDelegate> {
    Preambles       *preambles;
    TikzDocument    *document;
    PopplerDocument *pdfDocument;
    PopplerPage     *pdfPage;
}

- (id) initWithPreambles:(Preambles*)p;

- (BOOL) updateWithError:(NSError**)error;
- (BOOL) update;
- (BOOL) isValid;

- (Preambles*) preambles;

- (TikzDocument*) document;
- (void) setDocument:(TikzDocument*)doc;

- (double) width;
- (double) height;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
