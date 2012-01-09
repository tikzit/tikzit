//
//  SelectBoxLayer.m
//  TikZiT
//
//  Created by Aleks Kissinger on 14/06/2010.
//  Copyright 2010 __MyCompanyName__. All rights reserved.
//

#import "SelectBoxLayer.h"


@implementation SelectBoxLayer

@synthesize active;

- (id)init {
	[super init];
	box = CGRectMake(0.0f, 0.0f, 0.0f, 0.0f);
	active = NO;
	return self;
}

- (void)setSelectBox:(NSRect)r {
	box = NSRectToCGRect(r);
}

- (NSRect)selectBox {
	return NSRectFromCGRect(box);
}

- (void)drawInContext:(CGContextRef)context {
	if (active) {
		CGContextAddRect(context, box);
		
		CGContextSetRGBStrokeColor(context, 0.6, 0.6, 0.6, 1);
		CGContextSetRGBFillColor(context, 0.8, 0.8, 0.8, 0.2);
		CGContextSetLineWidth(context, 1);
		
		CGContextSetShouldAntialias(context, NO);
		CGContextDrawPath(context, kCGPathFillStroke);
	}
}

+ (SelectBoxLayer*)layer {
	return [[[SelectBoxLayer alloc] init] autorelease];
}

@end
