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

#import "Node+Render.h"
#import "Shape.h"
#import "Shape+Render.h"
#import "ShapeNames.h"

#define DEFAULT_STROKE_WIDTH 2.0f
#define MAX_LABEL_LENGTH 10
#define LABEL_PADDING_X 2
#define LABEL_PADDING_Y 2

@implementation Node (Render)

- (Transformer*) shapeTransformerForSurface:(id<Surface>)surface {
    Transformer *transformer = [[[surface transformer] copy] autorelease];
    NSPoint screenPos = [[surface transformer] toScreen:point];
    [transformer setOrigin:screenPos];
    CGFloat scale = [[surface transformer] scale];
    if (style) {
        scale *= [style scale];
    }
    [transformer setScale:scale];
    return transformer;
}

- (Shape*) shape {
    if (style) {
        return [Shape shapeForName:[style shapeName]];
    } else {
        return [Shape shapeForName:SHAPE_CIRCLE];
    }
}

- (NSRect) boundsUsingShapeTransform:(Transformer*)shapeTrans {
    float strokeThickness = style ? [style strokeThickness] : DEFAULT_STROKE_WIDTH;
    NSRect screenBounds = [shapeTrans rectToScreen:[[self shape] boundingRect]];
    screenBounds = NSInsetRect(screenBounds, -strokeThickness, -strokeThickness);
    return screenBounds;
}

- (NSRect) boundsOnSurface:(id<Surface>)surface {
    return [self boundsUsingShapeTransform:[self shapeTransformerForSurface:surface]];
}

- (NSRect) boundsWithLabelOnSurface:(id<Surface>)surface {
    NSRect nodeBounds = [self boundsOnSurface:surface];
    NSRect labelRect = NSZeroRect;
    if (![label isEqual:@""]) {
        id<RenderContext> cr = [surface createRenderContext];
        labelRect.size = [self renderedLabelSizeInContext:cr];
        NSPoint nodePos = [[surface transformer] toScreen:point];
        labelRect.origin.x = nodePos.x - (labelRect.size.width / 2);
        labelRect.origin.y = nodePos.y - (labelRect.size.height / 2);
    }
    return NSUnionRect(nodeBounds, labelRect);
}

- (RColor) strokeColor {
    if (style) {
        return [[style strokeColorRGB] rColor];
    } else {
        return MakeRColor (0.4, 0.4, 0.7, 0.8);
    }
}

- (RColor) fillColor {
    if (style) {
        return [[style fillColorRGB] rColor];
    } else {
        return MakeRColor (0.4, 0.4, 0.7, 0.3);
    }
}

- (NSString*) renderedLabel {
    NSString *r_label = [label stringByExpandingLatexConstants];
    if ([r_label length] > MAX_LABEL_LENGTH) {
        r_label = [[[r_label substringToIndex:MAX_LABEL_LENGTH-1] stringByTrimmingSpaces] stringByAppendingString:@"..."];
    } else {
        r_label = [r_label stringByTrimmingSpaces];
    }
    return r_label;
}

- (NSSize) renderedLabelSizeInContext:(id<RenderContext>)context {
    NSSize result = {0, 0};
    if (![label isEqual:@""]) {
        NSString *r_label = [self renderedLabel];

        id<TextLayout> layout = [context layoutText:r_label withSize:9];

        result = [layout size];
        result.width += LABEL_PADDING_X;
        result.height += LABEL_PADDING_Y;
    }
    return result;
}

- (void) renderLabelToSurface:(id <Surface>)surface withContext:(id<RenderContext>)context {
    [self renderLabelAt:[[surface transformer] toScreen:point] withContext:context];
}

- (void) renderLabelAt:(NSPoint)p withContext:(id<RenderContext>)context {
    // draw latex code overlayed on node
    if (![label isEqual:@""]) {
        [context saveState];

        NSString *r_label = [self renderedLabel];
        id<TextLayout> layout = [context layoutText:r_label withSize:9];

        NSSize labelSize = [layout size];

        NSRect textBounds = NSMakeRect (p.x - labelSize.width/2,
                p.y - labelSize.height/2,
                labelSize.width,
                labelSize.height);
        NSRect backRect = NSInsetRect (textBounds, -LABEL_PADDING_X, -LABEL_PADDING_Y);

        [context startPath];
        [context setLineWidth:1.0];
        [context rect:backRect];
        RColor fColor = MakeRColor (1.0, 1.0, 0.5, 0.7);
        RColor sColor = MakeRColor (0.5, 0.0, 0.0, 0.7);
        [context strokePathWithColor:sColor andFillWithColor:fColor];

        [layout showTextAt:textBounds.origin withColor:BlackRColor];

        [context restoreState];
    }
}

- (void) renderToSurface:(id <Surface>)surface withContext:(id<RenderContext>)context state:(enum NodeState)state {
    Transformer *shapeTrans = [self shapeTransformerForSurface:surface];
    float strokeThickness = style ? [style strokeThickness] : DEFAULT_STROKE_WIDTH;

    [context saveState];

    [[self shape] drawPathWithTransform:shapeTrans andContext:context];

    [context setLineWidth:strokeThickness];
    if (!style) {
        [context setLineDash:3.0];
    }
    [context strokePathWithColor:[self strokeColor] andFillWithColor:[self fillColor]];

    if (state != NodeNormal) {
        [context setLineWidth:strokeThickness + 4.0];
        [context setLineDash:0.0];
        float alpha = 0.0f;
        if (state == NodeSelected)
            alpha = 0.5f;
        else if (state == NodeHighlighted)
            alpha = 0.25f;
        RColor selectionColor = MakeSolidRColor(0.61f, 0.735f, 1.0f);

        [[self shape] drawPathWithTransform:shapeTrans andContext:context];
        [context strokePathWithColor:selectionColor andFillWithColor:selectionColor usingAlpha:alpha];
    }

    [context restoreState];
    [self renderLabelToSurface:surface withContext:context];
}

- (BOOL) hitByPoint:(NSPoint)p onSurface:(id<Surface>)surface {
    Transformer *shapeTrans = [self shapeTransformerForSurface:surface];

    NSRect screenBounds = [self boundsUsingShapeTransform:shapeTrans];
    if (!NSPointInRect(p, screenBounds)) {
        return NO;
    }

    float strokeThickness = style ? [style strokeThickness] : DEFAULT_STROKE_WIDTH;
    id<RenderContext> ctx = [surface createRenderContext];
    [ctx setLineWidth:strokeThickness];
    [[self shape] drawPathWithTransform:shapeTrans andContext:ctx];
    return [ctx strokeIncludesPoint:p] || [ctx fillIncludesPoint:p];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
