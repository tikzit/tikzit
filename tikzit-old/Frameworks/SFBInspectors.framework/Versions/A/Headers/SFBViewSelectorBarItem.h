/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

@interface SFBViewSelectorBarItem : NSObject
{
@private
	NSString *_identifier;
	NSString *_label;
	NSString *_tooltip;
	NSImage *_image;
	NSView *_view;
}

@property (copy) NSString * identifier;
@property (copy) NSString * label;
@property (copy) NSString * tooltip;
@property (copy) NSImage * image;
@property (retain) NSView * view;

+ (id) itemWithIdentifier:(NSString *)identifier label:(NSString *)label tooltip:(NSString *)tooltip image:(NSImage *)image view:(NSView *)view;

- (id) initWithIdentifier:(NSString *)identifier label:(NSString *)label tooltip:(NSString *)tooltip image:(NSImage *)image view:(NSView *)view;

@end
