/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

#define VIEW_SELECTOR_BAR_HEIGHT 25

@class SFBViewSelectorBar;

@interface SFBViewSelector : NSView
{
@private
	NSSize _initialWindowSize;
	SFBViewSelectorBar *_selectorBar;
	NSView *_bodyView;
}

- (SFBViewSelectorBar *) selectorBar;

@end
