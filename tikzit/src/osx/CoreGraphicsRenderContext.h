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

@interface CoreTextLayout: NSObject<TextLayout> {
	CFAttributedStringRef attrString;
	CTFontRef font;
	CTLineRef line;
	CGContextRef ctx;
}

+ (CoreTextLayout*) layoutForContext:(CGContextRef)c withString:(NSString*)string fontSize:(CGFloat)fontSize;
- (id) initWithContext:(CGContextRef)cr withString:(NSString*)string fontSize:(CGFloat)fontSize;

@end

@interface CoreGraphicsRenderContext: NSObject<RenderContext> {
	CGContextRef ctx;
}

+ (CoreGraphicsRenderContext*) contextWithCGContext:(CGContextRef)c;
+ (id) initWithCGContext:(CGContextRef)c;

- (CGContextRef) ctx;

@end

// vim:ft=objc:ts=4:noet:sts=4:sw=4
