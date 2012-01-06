//
//  CALayer+DrawLabel.m
//  TikZiT
//
//  Created by Aleks Kissinger on 09/05/2011.
//  Copyright 2011 Aleks Kissinger. All rights reserved.
//

#import "CALayer+DrawLabel.h"
#import "Transformer.h"

@implementation CALayer(DrawLabel)

- (void)drawLabel:(NSString*)label
		  atPoint:(NSPoint)pt
		inContext:(CGContextRef)context
	   usingTrans:(Transformer*)t {
	
	CGContextSaveGState(context);
	
	if ([label length] > 15) {
		label = [[label substringToIndex:12] stringByAppendingString:@"..."];
	}
	
	float fontSize = [t scaleToScreen:0.18f]; // size 9 @ 100%
	if (fontSize > 18.0f) fontSize = 18.0f;
	
	// Prepare font
	CTFontRef font = CTFontCreateWithName(CFSTR("Monaco"), fontSize, NULL);
	
	// Create an attributed string
	CFStringRef keys[] = { kCTFontAttributeName };
	CFTypeRef values[] = { font };
	CFDictionaryRef attr = CFDictionaryCreate(NULL,
											  (const void **)&keys,
											  (const void **)&values,
											  sizeof(keys) / sizeof(keys[0]),
											  &kCFTypeDictionaryKeyCallBacks,
											  &kCFTypeDictionaryValueCallBacks);
	CFAttributedStringRef attrString =
	CFAttributedStringCreate(NULL, (CFStringRef)label, attr);
	CFRelease(attr);
	
	// Draw the string
	CTLineRef line = CTLineCreateWithAttributedString(attrString);
	CGContextSetTextMatrix(context, CGAffineTransformIdentity);
	CGContextSetTextPosition(context, 0, 0);
	
	CGRect labelBounds = CGRectIntegral(CTLineGetImageBounds(line, context));
	//int shiftx = round(labelBounds.size.width / 2);
	
	CGContextSetTextPosition(context,
							 round(pt.x - (labelBounds.size.width/2)), 
							 round(pt.y - (0.9*labelBounds.size.height/2)));
	
	labelBounds = CGRectIntegral(CTLineGetImageBounds(line, context));
	labelBounds.origin.x -= 2;
	labelBounds.origin.y -= 2;
	labelBounds.size.width += 4;
	labelBounds.size.height += 4;
	
	CGContextSetShouldAntialias(context, NO);
	
	CGContextSetRGBFillColor(context, 1.0f, 1.0f, 0.5f, 0.7f);
	CGContextSetRGBStrokeColor(context, 0.5f, 0.0f, 0.0f, 0.7f);
	
	CGContextFillRect(context, labelBounds);
	CGContextStrokeRect(context, labelBounds);
	
	CGContextSetShouldAntialias(context, YES);
	
	CGContextSetRGBFillColor(context, 0.3f, 0.3f, 0.3f, 0.7f);
	
	CTLineDraw(line, context);
	
	// Clean up
	CFRelease(line);
	CFRelease(attrString);
	CFRelease(font);	
	
	CGContextRestoreGState(context);
}

@end
