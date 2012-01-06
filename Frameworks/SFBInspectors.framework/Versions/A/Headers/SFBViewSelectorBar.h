/*
 *  Copyright (C) 2009 Stephen F. Booth <me@sbooth.org>
 *  All Rights Reserved
 */

#import <Cocoa/Cocoa.h>

@class SFBViewSelectorBarItem;

@interface SFBViewSelectorBar : NSView
{
@private
	NSInteger _selectedIndex;
	NSInteger _pressedIndex;
	NSMutableArray *_items;
}

@property (assign) NSInteger selectedIndex;
@property (readonly) SFBViewSelectorBarItem * selectedItem;

- (void) addItem:(SFBViewSelectorBarItem *)item;

- (BOOL) selectItem:(SFBViewSelectorBarItem *)item;
- (BOOL) selectItemWithIdentifer:(NSString *)itemIdentifier;

- (SFBViewSelectorBarItem *) itemAtIndex:(NSInteger)itemIndex;
- (SFBViewSelectorBarItem *) itemWithIdentifier:(NSString *)itemIdentifier;

@end
