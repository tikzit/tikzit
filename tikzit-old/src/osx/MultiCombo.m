//
//  MultiCombo.m
//  TikZiT
//
//  Created by Aleks Kissinger on 21/04/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "MultiCombo.h"


@implementation MultiCombo

- (void)textDidChange:(NSNotification *)notification {
	[super textDidChange:notification];
	[self setMulti:NO];
}

- (void)setMulti:(BOOL)m {
	multi = m;
	if (multi) {
		[self setTextColor:[NSColor grayColor]];
		[self setStringValue:@"multiple values"];
	}
}

- (BOOL)multi { return multi; }

- (BOOL)becomeFirstResponder {
	[super becomeFirstResponder];
	if ([self multi]) {
		[self setTextColor:[NSColor blackColor]];
		[self setStringValue:@""];
	}
	return YES;
}

@end
