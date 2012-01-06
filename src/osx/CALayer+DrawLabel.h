//
//  CALayer+DrawLabel.h
//  TikZiT
//
//  Created by Aleks Kissinger on 09/05/2011.
//  Copyright 2011 Aleks Kissinger. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <QuartzCore/CoreAnimation.h>

@class Transformer;

@interface CALayer(DrawLabel)

- (void)drawLabel:(NSString*)label
		  atPoint:(NSPoint)pt
		inContext:(CGContextRef)context
	   usingTrans:(Transformer*)t;

@end
