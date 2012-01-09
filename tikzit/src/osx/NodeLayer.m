//
//  NodeLayer.m
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

#import "NodeLayer.h"
#import "CALayer+DrawLabel.h"
#import "NSString+LatexConstants.h"
#import "Shape.h"
#import "ShapeNames.h"
#import "Node.h"
#import "Edge.h"

@implementation NodeLayer

@synthesize node, selection, rescale;

- (id)initWithNode:(Node *)n transformer:(Transformer*)t {
	[super init];
	node = n;
	selection = [[NodeSelectionLayer alloc] init];
    [selection setNodeLayer:self];
	localTrans = [[Transformer alloc] init];
	
	[self addSublayer:selection];
	textwidth = 0.0f;
	center = NSMakePoint(0.0f, 0.0f);
	transformer = t;
    
    path = NULL;
    rescale = YES;
    dirty = YES;
	
	[self updateFrame];
	return self;
}

- (NSColor*)strokeColor {
	if ([node style] != nil) {
		return [[[node style] strokeColor] colorUsingColorSpace:[NSColorSpace deviceRGBColorSpace]];
	} else {
		return nil;
	}
}

- (NSColor*)fillColor {
	if ([node style] != nil) {
		return [[[node style] fillColor] colorUsingColorSpace:[NSColorSpace deviceRGBColorSpace]];
	} else {
		return nil;
	}
}

- (float)strokeWidth {
	if ([node style] != nil) {
		return [node.style strokeThickness];
	} else {
		return 1;
	}
}

- (NSPoint)center { return center; }

- (void)setCenter:(NSPoint)ctr {
	center.x = round(ctr.x);
	center.y = round(ctr.y);
	[self updateFrame];
}

- (void)setCenter:(NSPoint)ctr andAnimateWhen:(BOOL)anim {
	[CATransaction begin];
	if (!anim) {
		[CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
	}
	[self setCenter:ctr];
	[CATransaction commit];
}

- (void)updateShape {
    Shape *s = ([node style] != nil) ?
        [Shape shapeForName:[[node style] shapeName]] :
        [Shape shapeForName:SHAPE_CIRCLE];
    if (s != shape) { // straight pointer comparison
        shape = s;
        dirty = YES;
    }
}

- (void)updateLocalTrans {
    float scale = ([node style] != nil) ? [[node style] scale] : 1.0f;
    
    Transformer *t = [Transformer transformer];
    float rad = ([transformer scaleToScreen:scale] / 2.0f) + 8.0f;
    [t setOrigin:NSMakePoint(rad, rad)];
    [t setScale:[transformer scale]*((rescale)?scale:0.8f)];
    
    if (![localTrans isEqual:t]) {
        dirty = YES;
        localTrans = t;
    }
}

- (void)updateFrame {
	[self updateLocalTrans];
    [self updateShape];
	float rad = [localTrans origin].x;
	[self setFrame:CGRectIntegral(CGRectMake(center.x - rad, center.y - rad, 2*rad, 2*rad))];
	NSRect bds = NSMakeRect(0, 0, 2*rad, 2*rad);
	[selection setFrame:NSRectToCGRect(bds)];
	
	[self setNeedsDisplay];
	[selection setNeedsDisplay];
}

- (CGMutablePathRef)path {
    if (dirty) {
        CGMutablePathRef pth = CGPathCreateMutable();
        NSPoint p, cp1, cp2;
        for (NSArray *arr in [shape paths]) {
            BOOL fst = YES;
            for (Edge *e in arr) {
                if (fst) {
                    fst = NO;
                    p = [localTrans toScreen:[[e source] point]];
                    CGPathMoveToPoint(pth, nil, p.x, p.y);
                }
                
                p = [localTrans toScreen:[[e target] point]];
                if ([e isStraight]) {
                    CGPathAddLineToPoint(pth, nil, p.x, p.y);
                } else {
                    cp1 = [localTrans toScreen:[e cp1]];
                    cp2 = [localTrans toScreen:[e cp2]];
                    CGPathAddCurveToPoint(pth, nil, cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y);
                }
            }
            
            CGPathCloseSubpath(pth);
        }
        
        if (path != NULL) CFRelease(path);
        path = pth;
        dirty = NO;
    }
	
    
	return path;
}

- (BOOL)nodeContainsPoint:(NSPoint)p {
	CGPoint p1 = CGPointMake(p.x - [self frame].origin.x, p.y - [self frame].origin.y);
	return CGPathContainsPoint([self path],nil,p1,NO);
}


- (void)drawInContext:(CGContextRef)context {
	CGContextSaveGState(context);
	
	
	if ([node style] == nil) {
		CGContextSetRGBStrokeColor(context, 0.4f, 0.4f, 0.7f, 1.0f);
		CGContextSetRGBFillColor(context, 0.4f, 0.4f, 0.7f, 1.0f);
		//CGRect fr = [self frame];
		CGRect bds = NSRectToCGRect([localTrans rectToScreen:NSMakeRect(-0.5, -0.5, 1, 1)]);
		CGRect pt = CGRectMake(CGRectGetMidX(bds)-1.0f, CGRectGetMidY(bds)-1.0f, 2.0f, 2.0f);
		CGContextSetLineWidth(context, 0);
		CGContextAddEllipseInRect(context, pt);
		CGContextFillPath(context);
		
		// HACK: for some reason, CGFloat isn't getting typedef'ed properly
		
#ifdef __x86_64__
		const double dash[2] = {2.0,2.0};
#else
		const float dash[2] = {2.0,2.0};
#endif
		CGContextSetLineDash(context, 0.0, dash, 2);
		CGContextSetLineWidth(context, 1);
		CGContextAddPath(context, [self path]);
		CGContextStrokePath(context);
	} else {
		NSColor *stroke = [self strokeColor];
		NSColor *fill = [self fillColor];
		
		CGContextSetRGBStrokeColor(context,
								   [stroke redComponent],
								   [stroke greenComponent],
								   [stroke blueComponent],
								   [stroke alphaComponent]);
		
		CGContextSetLineWidth(context, [self strokeWidth]);
		
		CGContextSetRGBFillColor(context,
								 [fill redComponent],
								 [fill greenComponent],
								 [fill blueComponent],
								 [fill alphaComponent]);
		
		
		CGContextSetLineWidth(context, [self strokeWidth]);
		CGContextAddPath(context, [self path]);
		CGContextDrawPath(context, kCGPathFillStroke);
	}
	
	if (!([node label] == nil || [[node label] isEqual:@""])) {
		NSPoint labelPt = NSMakePoint([self frame].size.width/2, [self frame].size.height/2);
		[self drawLabel:[[node label] stringByExpandingLatexConstants]
				atPoint:labelPt
			  inContext:context
			 usingTrans:transformer];
	}
	
	CGContextRestoreGState(context);
}

- (void)dealloc {
    if (path != NULL) CFRelease(path);
    [super dealloc];
}

@end
