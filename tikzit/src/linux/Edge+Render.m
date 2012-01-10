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

#import "Edge+Render.h"
#import "Node+Render.h"
#import "../common/util.h"

static const float edgeWidth = 2.0;
static const float cpRadius = 3.0;
static const float cpLineWidth = 1.0;

@implementation Edge (Render)

+ (float) controlPointRadius {
    return cpRadius;
}

- (float) controlDistanceWithTransformer:(Transformer*)transformer {
    NSPoint c_source = [transformer toScreen:src];
    NSPoint c_target = [transformer toScreen:targ];
    const float dx = (c_target.x - c_source.x);
    const float dy = (c_target.y - c_source.y);
    if (dx == 0 && dy == 0) {
        return [transformer scaleToScreen:weight];
    } else {
        return NSDistanceBetweenPoints(c_source, c_target) * weight;
    }
}

- (void) renderControlsToSurface:(id <Surface>)surface withContext:(id<RenderContext>)context {
    Transformer *transformer = [surface transformer];

    [context saveState];

    [self updateControls];

    NSPoint c_source = [transformer toScreen:src];
    NSPoint c_target = [transformer toScreen:targ];
    NSPoint c_mid = [transformer toScreen:mid];

    const float dx = (c_target.x - c_source.x);
    const float dy = (c_target.y - c_source.y);

    [context setLineWidth:cpLineWidth];
    RColor fillColor = MakeRColor (1.0, 1.0, 1.0, 0.5);

    // draw a circle at the mid point
    [context startPath];
    [context circleAt:c_mid withRadius:cpRadius];
    [context strokePathWithColor:MakeSolidRColor(0, 0, 1) andFillWithColor:fillColor];

    //[context setAntialiasMode:AntialiasDisabled];

    // size of control circles
    float c_dist = 0.0f;
    if (dx == 0 && dy == 0) {
        c_dist = [transformer scaleToScreen:weight];
    } else {
        c_dist = NSDistanceBetweenPoints(c_source, c_target) * weight;
    }

    // basic bend is blue, in-out is green
    RColor controlTrackColor;
    if ([self bendMode] == EdgeBendModeBasic) {
        controlTrackColor = MakeRColor (0.0, 0.0, 1.0, 0.4);
    } else {
        controlTrackColor = MakeRColor (0.0, 0.7, 0.0, 0.4);
    }

    [context startPath];
    [context circleAt:c_source withRadius:c_dist];
    if (dx != 0 || dy != 0) {
        [context circleAt:c_target withRadius:c_dist];
    }
    [context strokePathWithColor:controlTrackColor];

    RColor handleColor = MakeRColor (1.0, 0.0, 1.0, 0.6);
    if ([self bendMode] == EdgeBendModeBasic) {
        if (bend % 45 != 0) {
            handleColor = MakeRColor (0.0, 0.0, 0.1, 0.4);
        }
    } else if ([self bendMode] == EdgeBendModeInOut) {
        if (outAngle % 45 != 0) {
            handleColor = MakeRColor (0.0, 0.7, 0.0, 0.4);
        }
    }

    NSPoint c_cp1 = [transformer toScreen:cp1];
    [context moveTo:c_source];
    [context lineTo:c_cp1];
    [context circleAt:c_cp1 withRadius:cpRadius];
    [context strokePathWithColor:handleColor];

    if ([self bendMode] == EdgeBendModeInOut) {
        // recalculate color based on inAngle
        if (inAngle % 45 == 0) {
            handleColor = MakeRColor (1.0, 0.0, 1.0, 0.6);
        } else {
            handleColor = MakeRColor (0.0, 0.7, 0.0, 0.4);
        }
    }

    NSPoint c_cp2 = [transformer toScreen:cp2];
    [context moveTo:c_target];
    [context lineTo:c_cp2];
    [context circleAt:c_cp2 withRadius:cpRadius];
    [context strokePathWithColor:handleColor];

    [context restoreState];
}

- (void) createStrokePathInContext:(id<RenderContext>)context withTransformer:(Transformer*)transformer {
    NSPoint c_source = [transformer toScreen:src];
    NSPoint c_cp1 = [transformer toScreen:cp1];
    NSPoint c_cp2 = [transformer toScreen:cp2];
    NSPoint c_target = [transformer toScreen:targ];

    [context startPath];
    [context moveTo:c_source];
    [context curveTo:c_target withCp1:c_cp1 andCp2:c_cp2];

    if ([self style] != nil) {
        // draw edge decoration
        switch ([[self style] decorationStyle]) {
            case ED_None:
                break;
            case ED_Tick:
                [context moveTo:[transformer toScreen:[self leftNormal]]];
                [context lineTo:[transformer toScreen:[self rightNormal]]];
                break;
            case ED_Arrow:
                [context moveTo:[transformer toScreen:[self leftNormal]]];
                [context lineTo:[transformer toScreen:[self midTan]]];
                [context lineTo:[transformer toScreen:[self rightNormal]]];
                break;
        }
    }

}

- (void) renderToSurface:(id <Surface>)surface withContext:(id<RenderContext>)context selected:(BOOL)selected {
    [self updateControls];

    [context saveState];
    const CGFloat lineWidth = style ? [style thickness] : edgeWidth;
    [context setLineWidth:lineWidth];
    [self createStrokePathInContext:context withTransformer:[surface transformer]];
    RColor color = BlackRColor;
    if (selected) {
        color.alpha = 0.5;
    }
    [context strokePathWithColor:color];
    [context restoreState];

    if (selected) {
        [self renderControlsToSurface:surface withContext:context];
    }

    if ([self hasEdgeNode]) {
        NSPoint labelPt = [[surface transformer] toScreen:[self mid]];
        [[self edgeNode] renderLabelAt:labelPt
                           withContext:context];
    }
}

- (NSRect) renderedBoundsWithTransformer:(Transformer*)t whenSelected:(BOOL)selected {
    NSRect bRect = [t rectToScreen:[self boundingRect]];
    if (selected) {
        float c_dist = [self controlDistanceWithTransformer:t];
        return NSInsetRect (bRect, -c_dist, -c_dist);
    } else {
        return bRect;
    }
}

- (BOOL) hitByPoint:(NSPoint)p onSurface:(id<Surface>)surface withFuzz:(float)fuzz {
    [self updateControls];

    NSRect boundingRect = [[surface transformer] rectToScreen:[self boundingRect]];
    if (!NSPointInRect(p, NSInsetRect(boundingRect, -fuzz, -fuzz))) {
        return NO;
    }

    id<RenderContext> cr = [surface createRenderContext];

    [cr setLineWidth:edgeWidth + 2 * fuzz];
    [self createStrokePathInContext:cr withTransformer:[surface transformer]];

    return [cr strokeIncludesPoint:p];
}

@end

// vim:ft=objc:ts=4:et:sts=4:sw=4
