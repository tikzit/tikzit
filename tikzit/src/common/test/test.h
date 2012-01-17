//
//  test.h
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
#import <Foundation/Foundation.h>

@interface Allocator : NSObject
{}
@end

BOOL fuzzyCompare (float f1, float f2);
BOOL fuzzyComparePoints (NSPoint p1, NSPoint p2);

void setColorEnabled(BOOL b);

void pass(NSString *msg);
void fail(NSString *msg);
void TEST(NSString *msg, BOOL test);
void assertRectsEqual (NSString *msg, NSRect val, NSRect exp);
void assertPointsEqual (NSString *msg, NSPoint val, NSPoint exp);
void assertFloatsEqual (NSString *msg, float val, float exp);

void startTests();
void endTests();

void startTestBlock(NSString *name);
void endTestBlock(NSString *name);

#define PUTS(fmt, ...) { \
	NSString *_str = [[NSString alloc] initWithFormat:fmt, ##__VA_ARGS__]; \
	printf("%s\n", [_str UTF8String]); \
	[_str release]; }

#define failFmt(fmt, ...) { \
	NSString *_fstr = [[NSString alloc] initWithFormat:fmt, ##__VA_ARGS__]; \
	fail(_fstr); \
	[_fstr release]; }

// vim:ft=objc:ts=4:sts=4:sw=4:noet
