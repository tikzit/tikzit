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

BOOL fuzzyCompare(float f1, float f2) {
	return (ABS(f1 - f2) <= 0.00001f * MAX(1.0f,MIN(ABS(f1), ABS(f2))));
}

BOOL fuzzyComparePoints (NSPoint p1, NSPoint p2) {
	return fuzzyCompare (p1.x, p2.x) && fuzzyCompare (p1.y, p2.y);
}

void pass(NSString *msg) {
	PUTS(@"%@[%@PASS%@] %@", INDENT, GREEN, OFF, msg);
	++PASSES;
}

void fail(NSString *msg) {
	PUTS(@"%@[%@FAIL%@] %@", INDENT, RED, OFF, msg);
	++FAILS;
}

void TEST(NSString *msg, BOOL test) {
	if (test) {
		pass (msg);
	} else {
		fail (msg);
	}
}

void assertRectsEqual (NSString *msg, NSRect r1, NSRect r2) {
	BOOL equal = fuzzyCompare (r1.origin.x, r2.origin.x) &&
	             fuzzyCompare (r1.origin.y, r2.origin.y) &&
	             fuzzyCompare (r1.size.width, r2.size.width) &&
	             fuzzyCompare (r1.size.height, r2.size.height);
	if (equal) {
		pass (msg);
	} else {
		failFmt(@"%@ (expected (%f,%f:%fx%f) but got (%f,%f:%fx%f))",
				msg,
				r2.origin.x, r2.origin.y, r2.size.width, r2.size.height,
				r1.origin.x, r1.origin.y, r1.size.width, r1.size.height);
	}
}

void assertPointsEqual (NSString *msg, NSPoint p1, NSPoint p2) {
	BOOL equal = fuzzyCompare (p1.x, p2.x) && fuzzyCompare (p1.y, p2.y);
	if (equal) {
		pass (msg);
	} else {
		failFmt(@"%@ (expected (%f,%f) but got (%f,%f)",
				msg,
				p2.x, p2.y,
				p1.x, p1.y);
	}
}

void assertFloatsEqual (NSString *msg, float f1, float f2) {
	if (fuzzyCompare (f1, f2)) {
		pass (msg);
	} else {
		failFmt(@"%@ (expected %f but got %f", msg, f2, f1);
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

#ifdef STAND_ALONE
void runTests();

int main() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	setColorEnabled (NO);
	startTests();

	runTests();

	endTests();

	[pool drain];
	return 0;
}
#endif

// vim:ft=objc:ts=4:sts=4:sw=4:noet
