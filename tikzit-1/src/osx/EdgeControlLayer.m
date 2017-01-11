//
//  EdgeControlLayer.m
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

#import "EdgeControlLayer.h"
#import "util.h"


@implementation EdgeControlLayer


- (id)initWithEdge:(Edge*)e andTransformer:(Transformer*)t {
	if (!(self = [super init])) return nil;
	transformer = t;
	edge = e;
	self.opacity = 0.0f;
	return self;
}

- (void)select {
	selected = YES;
	self.opacity = 1.0f;
}

- (void)deselect {
	selected = NO;
	self.opacity = 0.0f;
}

- (void)highlight {
	if (!selected) {
		self.opacity = 0.5f;
	}
}

- (void)unhighlight {
	if (!selected) {
		self.opacity = 0.0f;
	}
}

- (void)drawInContext:(CGContextRef)ctx {
	CGContextSaveGState(ctx);
	
	[edge updateControls];
	CGPoint source = NSPointToCGPoint([transformer toScreen:[[edge source] point]]);
	CGPoint target = NSPointToCGPoint([transformer toScreen:[[edge target] point]]);
	CGPoint mid = NSPointToCGPoint([transformer toScreen:[edge mid]]);
	CGPoint cp1 = NSPointToCGPoint([transformer toScreen:[edge cp1]]);
	CGPoint cp2 = NSPointToCGPoint([transformer toScreen:[edge cp2]]);
	
	float dx = (target.x - source.x);
	float dy = (target.y - source.y);
	
	// draw a circle at the midpoint
	CGRect mid_rect = CGRectMake(mid.x-3.0f, mid.y-3.0f, 6.0f, 6.0f);
	CGContextAddEllipseInRect(ctx, mid_rect);
	CGContextSetLineWidth(ctx, 1.0f);
	CGContextSetRGBFillColor(ctx, 1.0f, 1.0f, 1.0f, 0.5f);
	CGContextSetRGBStrokeColor(ctx, 0.0f, 0.0f, 1.0f, 0.5f);
	CGContextDrawPath(ctx, kCGPathFillStroke);
	
	
	CGContextSetShouldAntialias(ctx, YES);
	
	// compute size of control circles
	float cdist;
	if (dx == 0 && dy == 0) cdist = [transformer scaleToScreen:edge.weight];
	else cdist = sqrt(dx*dx + dy*dy) * edge.weight;
	
	// if basic bend, draw blue, if inout, draw green
	if ([edge bendMode] == EdgeBendModeBasic) CGContextSetRGBStrokeColor(ctx, 0, 0, 1, 0.4f);
	else CGContextSetRGBStrokeColor(ctx, 0, 0.7f, 0, 0.4f);
	
	// draw source control circle
	CGRect ellipse1 = CGRectMake(source.x-cdist, source.y-cdist, cdist*2.0f, cdist*2.0f);
	CGContextAddEllipseInRect(ctx, ellipse1);
	if (dx!=0 || dy!=0) {
		CGRect ellipse2 = CGRectMake(target.x-cdist, target.y-cdist, cdist*2.0f, cdist*2.0f);
		CGContextAddEllipseInRect(ctx, ellipse2);
	}
	
	CGContextStrokePath(ctx);
	
    float handleRad = [EdgeControlLayer handleRadius];
    
	// handles
	CGRect ctrl1 = CGRectMake(cp1.x-handleRad, cp1.y-handleRad, 2*handleRad, 2*handleRad);
	CGRect ctrl2 = CGRectMake(cp2.x-handleRad, cp2.y-handleRad, 2*handleRad, 2*handleRad);
	
    CGContextSetRGBFillColor(ctx, 1.0f, 1.0f, 1.0f, 0.8f);
	
	// draw a line from source vertex to first handle
	if ([edge bendMode] == EdgeBendModeInOut) {
		if ([edge outAngle] % 45 == 0) CGContextSetRGBStrokeColor(ctx, 1, 0, 1, 0.6f);
		else CGContextSetRGBStrokeColor(ctx, 0, 0.7f, 0, 0.4f);
	} else {
		if ([edge bend] % 45 == 0) CGContextSetRGBStrokeColor(ctx, 1, 0, 1, 0.6f);
		else CGContextSetRGBStrokeColor(ctx, 0, 0, 1, 0.4f);
	}
	
	CGContextMoveToPoint(ctx, source.x, source.y);
	CGContextAddLineToPoint(ctx, cp1.x, cp1.y);
	CGContextStrokePath(ctx);
    
    CGContextAddEllipseInRect(ctx, ctrl1);
    CGContextDrawPath(ctx, kCGPathFillStroke);
	
	
	// draw a line from target vertex to second handle
	if ([edge bendMode] == EdgeBendModeInOut) {
		if ([edge inAngle] % 45 == 0) CGContextSetRGBStrokeColor(ctx, 1, 0, 1, 0.6f);
		else CGContextSetRGBStrokeColor(ctx, 0, 0.7f, 0, 0.4f);
	} else {
		if ([edge bend] % 45 == 0) CGContextSetRGBStrokeColor(ctx, 1, 0, 1, 0.6f);
		else CGContextSetRGBStrokeColor(ctx, 0, 0, 1, 0.4f);
	}
    
	CGContextMoveToPoint(ctx, target.x, target.y);
	CGContextAddLineToPoint(ctx, cp2.x, cp2.y);
    CGContextStrokePath(ctx);
    
	CGContextAddEllipseInRect(ctx, ctrl2);
    CGContextDrawPath(ctx, kCGPathFillStroke);
	
	CGContextRestoreGState(ctx);
}

+ (float)handleRadius { return 4.0f; }

@end
