//
//  test.m
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
#import "test/test.h"

static int PASSES;
static int FAILS;

static int ALLOC_INSTANCES = 0;

static BOOL colorEnabled = YES;
static int depth = 0;

static NSString *RED, *GREEN, *BLUE, *OFF;

static NSString *indents[6] =
	{@"", @"  ", @"    ", @"      ",
	 @"        ", @"          "};

#define INDENT ((depth >= 6) ? indents[5] : indents[depth])


@implementation Allocator

+ (id)alloc {
	++ALLOC_INSTANCES;
	return [super alloc];
}

- (void)dealloc {
	--ALLOC_INSTANCES;
	[super dealloc];
}

+ (Allocator*)allocator {
	return [[[Allocator alloc] init] autorelease];
}

@end

void TEST(NSString *msg, BOOL test) {
	if (test) {
		PUTS(@"%@[%@PASS%@] %@", INDENT, GREEN, OFF, msg);
		++PASSES;
	} else {
		PUTS(@"%@[%@FAIL%@] %@", INDENT, RED, OFF, msg);
		++FAILS;
	}
}

void startTests() {
	PASSES = 0;
	FAILS = 0;
}

void endTests() {
	PUTS(@"Done testing. %@%d%@ passed, %@%d%@ failed.",
			  GREEN, PASSES, OFF,
			  RED, FAILS, OFF);
}

void startTestBlock(NSString *name) {
	PUTS(@"%@Starting %@%@%@ tests.", INDENT, BLUE, name, OFF);
	++depth;
}

void endTestBlock(NSString *name) {
	--depth;
	PUTS(@"%@Done with %@%@%@ tests.", INDENT, BLUE, name, OFF);
}

void setColorEnabled(BOOL b) {
	colorEnabled = b;
	if (b) {
		RED = @"\033[31;1m";
		GREEN = @"\033[32;1m";
		BLUE = @"\033[36;1m";
		OFF = @"\033[0m";
	} else {
		RED = @"";
		GREEN = @"";
		BLUE = @"";
		OFF = @"";
	}
}
