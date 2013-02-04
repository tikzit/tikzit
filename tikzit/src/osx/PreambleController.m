//
//  PreambleController.m
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  

#import "PreambleController.h"


@implementation PreambleController

@synthesize preambleText, preambles;

- (id)initWithWindowNibName:(NSString *)windowNibName plist:(NSString*)plist styles:(NSArray*)sty edges:(NSArray*)edg {
	[super initWithWindowNibName:windowNibName];
	
	preambles = (Preambles*)[NSKeyedUnarchiver unarchiveObjectWithFile:plist];
	[preambles setStyles:sty];
    [preambles setEdges:edg];
	if (preambles == nil) preambles = [[Preambles alloc] init];
	
	preambleText = nil;
	
	NSFont *font = [NSFont userFixedPitchFontOfSize:11.0f];
	textAttrs = [NSDictionary dictionaryWithObject:font forKey:NSFontAttributeName];
	ghostColor = [NSColor colorWithDeviceRed:0.9f green:0.9f blue:0.9f alpha:1.0f];
	
	
	
	return self;
}

- (void)awakeFromNib {
	NSArray *arr = [preambleDictionaryController arrangedObjects];
	NSString *current = [preambles selectedPreambleName];
	
	if (current != nil && ![current isEqual:@"default"]) {
		for (int i = 0; i < [arr count]; ++i) {
			if ([[[arr objectAtIndex:i] key] isEqual:current]) {
				[self setSelectionIndexes:[NSIndexSet indexSetWithIndex:i]];
				break;
			}
		}
	}
}

- (BOOL)useDefaultPreamble {
	return [[preambles selectedPreambleName] isEqualToString:@"default"];
}

- (void)flushText {
	if (preambleText != nil && ![self useDefaultPreamble]) {
		[preambles setCurrentPreamble:[preambleText string]];
	}
}

- (void)setCurrentPreamble:(NSString*)current {
	[self flushText];
	
	[self willChangeValueForKey:@"useDefaultPreamble"];
	[preambles setSelectedPreambleName:current];
	[self didChangeValueForKey:@"useDefaultPreamble"];
	
	[self setPreambleText:
	[[NSAttributedString alloc] initWithString:[preambles currentPreamble]
									attributes:textAttrs]];
}

- (void)showWindow:(id)sender {
	[super showWindow:sender];
	if ([self useDefaultPreamble]) {
		[toolbar setSelectedItemIdentifier:[defaultToolbarItem itemIdentifier]];
	} else {
		[toolbar setSelectedItemIdentifier:[customToolbarItem itemIdentifier]];
	}
	
	[self setPreamble:self];
}

- (void)savePreambles:(NSString*)plist {
	[self flushText];
	[NSKeyedArchiver archiveRootObject:preambles toFile:plist];
}

- (NSString*)currentPreamble {
	[self flushText];
	return [preambles currentPreamble];
}

- (NSString*)currentPostamble {
	return [preambles currentPostamble];
}

- (void)setSelectionIndexes:(NSIndexSet *)idx {
	[self willChangeValueForKey:@"selectionIndexes"];
	selectionIndexes = idx;
	[self didChangeValueForKey:@"selectionIndexes"];
	
	[self setPreamble:self];
}

- (NSIndexSet*)selectionIndexes {
	return selectionIndexes;
}

- (IBAction)setPreamble:(id)sender {
	if ([[toolbar selectedItemIdentifier] isEqualToString:[defaultToolbarItem itemIdentifier]]) {
		[self setCurrentPreamble:@"default"];
		[textView setBackgroundColor:ghostColor];
	} else if ([[toolbar selectedItemIdentifier] isEqualToString:[customToolbarItem itemIdentifier]]) {
		NSString *key = nil;
		if ([selectionIndexes count]==1) {
			int i = [selectionIndexes firstIndex];
			key = [[[preambleDictionaryController arrangedObjects] objectAtIndex:i] key];
		}
		if (key != nil) {
			[self setCurrentPreamble:key];
			//NSLog(@"preamble set to %@", key);
		} else {
			[self setCurrentPreamble:@"custom"];
			//NSLog(@"preamble set to custom");
		}
		[textView setBackgroundColor:[NSColor whiteColor]];
	}
}

- (IBAction)insertDefaultStyles:(id)sender {
	[textView insertText:[preambles styleDefinitions]];
}

- (IBAction)addPreamble:(id)sender {
	[preambleDictionaryController setInitialKey:@"new preamble"];
	[preambleDictionaryController setInitialValue:[preambles defaultPreamble]];
	[preambleDictionaryController add:sender];
}

- (void)controlTextDidEndEditing:(NSNotification *)obj {
	//NSLog(@"got a text change");
	[self setPreamble:[obj object]];
}


// NOT IMPLEMENTED
- (IBAction)duplicatePreamble:(id)sender {
//	NSLog(@"set text to: %@", [preambles currentPreamble]);
//	[preambleDictionaryController setInitialKey:[preambles selectedPreambleName]];
//	[preambleDictionaryController setInitialValue:[preambles currentPreamble]];
//	[preambleDictionaryController add:sender];
}


@end
