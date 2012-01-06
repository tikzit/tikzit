/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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

#import <Cocoa/Cocoa.h>
#import "RenderContext.h"

@implementation CoreTextLayout

+ (CoreTextLayout*) layoutForContext:(CGContextRef)c withString:(NSString*)string fontSize:(CGFloat)fontSize {
	return [[[self alloc] initWithContext:c withString:string fontSize:fontSize] autorelease];
}

- (id) initWithContext:(CGContextRef)cr withString:(NSString*)string fontSize:(CGFloat)fontSize {
	self = [super init];

	if (self == nil) {
		return nil;
	}

	CGContextRetain (cr);
	ctx = cr;
	font = CTFontCreateWithName(CFSTR("Monaco"), fontSize, NULL);
	
	// Create an attributed string
	CFStringRef keys[] = { kCTFontAttributeName };
	CFTypeRef values[] = { font };
	CFDictionaryRef attr = CFDictionaryCreate(NULL,
							  (const void **)&keys,
							  (const void **)&values,
							  sizeof(keys) / sizeof(keys[0]),
							  &kCFTypeDictionaryKeyCallBacks,
							  &kCFTypeDictionaryValueCallBacks);
	attrString = CFAttributedStringCreate(NULL, (CFStringRef)lab, attr);
	CFRelease(attr);
	line = CTLineCreateWithAttributedString(attrString);

	return self;
}

- (NSSize) size {
	CGRect labelBounds = CGRectIntegral(CTLineGetImageBounds(line, ctx));
	return labelBounds.size;
}

- (NSString*) text {
	return CFAttributedStringGetString (attrString);
}

- (void) showTextAt:(NSPoint)topLeft withColor:(RColor)color {
	CGContextSaveGState(ctx);

	CGContextSetRGBFillColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextSetRGBStrokeColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextSetShouldAntialias(ctx, YES);

	CGContextSetTextMatrix(ctx, CGAffineTransformIdentity);
	CGContextSetTextPosition(ctx, 0, 0);
	CGRect bounds = CGRectIntegral(CTLineGetImageBounds(line, ctx));
	CGContextSetTextPosition(ctx, topLeft.x - bounds.x, topLeft.y - bounds.y);

	CTLineDraw(line, ctx);

	CGContextRestoreGState(ctx);
}

- (void) dealloc {
	CFRelease(line);
	CFRelease(attrString);
	CFRelease(font);
	CGContextRelease (ctx);

	[super dealloc];
}

@end

@implementation CoreGraphicsRenderContext

+ (CoreGraphicsRenderContext*) contextWithCGContext:(CGContextRef)c {
	return [[[self alloc] initWithCGContext:c] autorelease];
}

+ (id) initWithCGContext:(CGContextRef)c {
	self = [super init];

	if (self) {
		ctx = c;
		CGContextRetain (ctx);
	}

	return self;
}

- (void) dealloc {
	CGContextRelease (ctx);

	[super dealloc];
}

- (CGContextRef) ctx {
	return ctx;
}

- (void) saveState {
	CGContextSaveGState(ctx);
}

- (void) restoreState {
	CGContextRestoreGState(ctx);
}

- (NSRect) clipBoundingBox {
	return CGContextGetClipBoundingBox (ctx);
}

- (BOOL) strokeIncludesPoint:(NSPoint)p {
    return CGContextPathContainsPoint(ctx, NSPointToCGPoint(p), kCGPathStroke);
}

- (BOOL) fillIncludesPoint:(NSPoint)p {
    return CGContextPathContainsPoint(ctx, NSPointToCGPoint(p), kCGPathFill);
}

- (id<TextLayout>) layoutText:(NSString*)text withSize:(CGFloat)fontSize {
	return [CoreTextLayout layoutForContext:ctx withString:text fontSize:fontSize];
}

// this may not affect text rendering
- (void) setAntialiasMode:(AntialiasMode)mode {
	CGContextSetShouldAntialias(ctx, mode != AntialiasDisabled);
}

- (void) setLineWidth:(CGFloat)width {
	CGContextSetLineWidth(ctx, width);
}

// setting to 0 will unset the dash
- (void) setLineDash:(CGFloat)dashLength {
	if (dashLength <= 0.0f) {
		CGContextSetLineDash(ctx, 0.0f, NULL, 0);
	} else {
		const CGFloat dash[] = {dashLength, dashLength};
		CGContextSetLineDash(ctx, 0.0f, dash, 2);
	}
}

// paths
- (void) startPath {
	CGContextBeginPath (ctx);
}

- (void) closeSubPath {
	CGContextClosePath (ctx);
}

- (void) moveTo:(NSPoint)p {
	CGContextMoveToPoint (ctx, p.x, p.y);
}

- (void) curveTo:(NSPoint)end withCp1:(NSPoint)cp1 andCp2:(NSPoint)cp2 {
	CGContextAddCurveToPoint(ctx, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
}

- (void) lineTo:(NSPoint)end {
	CGContextAddLineToPoint(ctx, end.x, end.y);
}

- (void) rect:(NSRect)rect {
	CGContextAddRect (ctx, rect);
}

- (void) circleAt:(NSPoint)c withRadius:(CGFloat)r {
	CGContextMoveToPoint (ctx, c.x + r, c.y);
	CGContextAddArc (ctx, c.x, c.y, r, 0.0f, M_PI, 1);
}

// these methods clear the path
- (void) strokePathWithColor:(RColor)color {
	CGContextSetRGBStrokeColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextDrawPath (ctx, kCGPathStroke);
}

- (void) fillPathWithColor:(RColor)color {
	CGContextSetRGBFillColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextDrawPath (ctx, kCGPathFill);
}

- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor {
	CGContextSetRGBFillColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextSetRGBStrokeColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGContextDrawPath (ctx, kCGPathFillStroke);
}

- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor
				  usingAlpha:(CGFloat)alpha {
	CGContextSetRGBFillColor(ctx, color.red, color.green, color.blue, color.alpha * alpha);
	CGContextSetRGBStrokeColor(ctx, color.red, color.green, color.blue, color.alpha * alpha);
	CGContextDrawPath (ctx, kCGPathFillStroke);
}

- (void) clipToPath {
	CGContextClip (ctx);
}

// paint everywhere within the clip
- (void) paintWithColor:(RColor)color {
	CGContextSetRGBFillColor(ctx, color.red, color.green, color.blue, color.alpha);
	CGRect r = CGContextGetClipBoundingBox (ctx);
	r.origin.x -= 1;
	r.origin.y -= 1;
	r.size.width += 2;
	r.size.height += 2;
	CGContextFillRect(context, r);
}

@end

// vim:ft=objc:ts=4:noet:sts=4:sw=4
