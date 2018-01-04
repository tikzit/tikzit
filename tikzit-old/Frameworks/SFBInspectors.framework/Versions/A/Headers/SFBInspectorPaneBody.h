/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

@interface SFBInspectorPaneBody : NSView
{
@private
	CGFloat _normalHeight;
}

@property (readonly, assign) CGFloat normalHeight;

@end
