/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

@class SFBInspectorPane;

@interface SFBInspectorPaneHeader : NSView
{
@private
	BOOL _pressed;
	NSButton *_disclosureButton;
	NSTextField *_titleTextField;
}

- (NSString *) title;
- (void) setTitle:(NSString *)title;

- (NSButton *) disclosureButton;
- (NSTextField *) titleTextField;

@end
