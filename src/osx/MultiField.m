//
//  LabelField.m
//  TikZiT
//
//  Created by Aleks Kissinger on 20/04/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "MultiField.h"


@implementation MultiField

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

//- (BOOL)textShouldBeginEditing:(NSText *)textObject {
//	[super textShouldBeginEditing:textObject];
//	NSLog(@"about to type");
//	return YES;
//}

//- (void)textDidEndEditing:(NSNotification *)obj {
//	[super textDidEndEditing:obj];
//	
//	NSLog(@"focus lost");
//	if ([self multi]) {
//		[self setMulti:YES];
//	}
//}

@end
