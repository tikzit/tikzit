/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

@interface SFBInspectorView : NSView
{
@private
	NSSize _initialWindowSize;
}

- (void) addInspectorPaneController:(NSViewController *)paneController;
- (void) addInspectorPane:(NSView *)paneBody title:(NSString *)title;

@end
