//
//  TikZiT
//
//  Copyright 2011 Alex Merry
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

#import "../util.h"

#import "test.h"

void testRectAroundPoints() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"NSRectAroundPoints");

	NSRect rect = NSRectAroundPoints (NSZeroPoint, NSZeroPoint);
	assertRectsEqual (@"(0,0) and (0,0)", rect, NSZeroRect);

	rect = NSRectAroundPoints (NSZeroPoint, NSMakePoint (1.0f, 1.0f));
	assertRectsEqual (@"(0,0) and (1,1)", rect, NSMakeRect (0.0f, 0.0f, 1.0f, 1.0f));

	rect = NSRectAroundPoints (NSMakePoint (-1.0f, 1.0f), NSMakePoint (1.0f, -1.0f));
	assertRectsEqual (@"(-1,1) and (1,-1)", rect, NSMakeRect (-1.0f, -1.0f, 2.0f, 2.0f));

	endTestBlock(@"NSRectAroundPoints");
	[pool drain];
}

void testRectAroundPointsWithPadding() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"NSRectAroundPointsWithPadding");

	NSRect rect = NSRectAroundPointsWithPadding (NSZeroPoint, NSZeroPoint, 0.0f);
	assertRectsEqual (@"(0,0) and (0,0); 0 padding", rect, NSZeroRect);

	rect = NSRectAroundPointsWithPadding (NSZeroPoint, NSZeroPoint, 0.2f);
	assertRectsEqual (@"(0,0) and (0,0); 0.2 padding", rect, NSMakeRect (-0.2f, -0.2f, 0.4f, 0.4f));

	rect = NSRectAroundPointsWithPadding (NSZeroPoint, NSMakePoint (1.0f, 1.0f), -0.2f);
	assertRectsEqual (@"(0,0) and (1,1); -0.2 padding", rect, NSMakeRect (0.2f, 0.2f, 0.6f, 0.6f));

	endTestBlock(@"NSRectAroundPointsWithPadding");
	[pool drain];
}

void testGoodAtan() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"good_atan");

	assertFloatsEqual (@"0.0, 0.0", good_atan (0.0f, 0.0f), 0.0f);
	assertFloatsEqual (@"0.0, 1.0", good_atan (0.0f, 1.0f), 0.5f * M_PI);
	assertFloatsEqual (@"0.0, -1.0", good_atan (0.0f, -1.0f), 1.5f * M_PI);
	assertFloatsEqual (@"1.0, 0.0", good_atan (1.0f, 0.0f), 0.0f);
	assertFloatsEqual (@"1.0, 0.1", good_atan (1.0f, 0.1f), 0.0996687f);

	endTestBlock(@"good_atan");
	[pool drain];
}

void testBezierInterpolate() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"bezierInterpolate");

	assertFloatsEqual (@"0.0, (0.0, 0.1, 0.2, 0.3)", bezierInterpolate (0.0f, 0.0f, 0.1f, 0.2f, 0.3f), 0.0f);
	assertFloatsEqual (@"1.0, (0.0, 0.1, 0.2, 0.3)", bezierInterpolate (1.0f, 0.0f, 0.1f, 0.2f, 0.3f), 0.3f);
	assertFloatsEqual (@"0.5, (0.0, 0.1, 0.2, 0.3)", bezierInterpolate (0.5f, 0.0f, 0.1f, 0.2f, 0.3f), 0.15f);
	// FIXME: other tests

	endTestBlock(@"bezierInterpolate");
	[pool drain];
}

void testLineSegmentsIntersect() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"lineSegmentsIntersect");

	BOOL result = NO;
	NSPoint intersection = NSMakePoint (-1.0f, -1.0f);

	result = lineSegmentsIntersect (NSMakePoint (-1.0f, -1.0f), NSMakePoint (1.0f, 1.0f),
	                                NSMakePoint (-1.0f, 1.0f), NSMakePoint (1.0f, -1.0f),
	                                &intersection);
	TEST (@"Cross at zero: has intersection", result);
	assertPointsEqual (@"Cross at zero: intersection value", intersection, NSZeroPoint);

	result = lineSegmentsIntersect (NSMakePoint (-1.0f, -1.0f), NSMakePoint (-0.5f, -0.5f),
	                                NSMakePoint (-1.0f, 1.0f), NSMakePoint (1.0f, -1.0f),
	                                &intersection);
	TEST (@"Fail to cross at zero", !result);

	result = lineSegmentsIntersect (NSMakePoint (1.0f, 1.0f), NSMakePoint (1.0f, -1.0f),
	                                NSMakePoint (0.0f, 0.0f), NSMakePoint (1.0f, 0.0f),
	                                &intersection);
	TEST (@"Touch at one: has intersection", result);
	assertPointsEqual (@"Touch at one: intersection value", intersection, NSMakePoint (1.0f, 0.0f));

	endTestBlock(@"lineSegmentsIntersect");
	[pool drain];
}

void testLineSegmentIntersectsRect() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"lineSegmentIntersectsRect");

	BOOL result = NO;

	result = lineSegmentIntersectsRect (
			NSMakePoint (-1.0f, -1.0f),
			NSMakePoint (0.0f, 0.0f),
	        NSZeroRect);
	TEST (@"Zero rect; line touches zero", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (-1.0f, -1.0f),
			NSMakePoint (-0.1f, -0.1f),
	        NSZeroRect);
	TEST (@"Zero rect; line short of zero", !result);

	NSRect rect = NSMakeRect (1.0f, 1.0f, 1.0f, 1.0f);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 0.0f),
			NSMakePoint (3.0f, 1.0f),
	        rect);
	TEST (@"Line underneath", !result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 0.0f),
			NSMakePoint (1.0f, 3.0f),
	        rect);
	TEST (@"Line to left", !result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 2.0f),
			NSMakePoint (3.0f, 3.0f),
	        rect);
	TEST (@"Line above", !result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (2.0f, 0.0f),
			NSMakePoint (3.0f, 3.0f),
	        rect);
	TEST (@"Line to right", !result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 0.0f),
			NSMakePoint (0.9f, 0.9f),
	        rect);
	TEST (@"Line short", !result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (1.1f, 1.1f),
			NSMakePoint (1.9f, 1.9f),
	        rect);
	TEST (@"Line inside", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 1.5f),
			NSMakePoint (3.0f, 1.5f),
	        rect);
	TEST (@"Horizontal line through", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (1.5f, 0.0f),
			NSMakePoint (1.5f, 3.0f),
	        rect);
	TEST (@"Vertical line through", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.5f, 1.0f),
			NSMakePoint (2.0f, 2.5f),
	        rect);
	TEST (@"Cut top and left", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (2.0f, 0.5f),
			NSMakePoint (0.5f, 2.0f),
	        rect);
	TEST (@"Cut bottom and left", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (1.0f, 0.5f),
			NSMakePoint (2.5f, 2.0f),
	        rect);
	TEST (@"Cut bottom and right", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 1.0f),
			NSMakePoint (2.0f, 3.0f),
	        rect);
	TEST (@"Touch top left", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (1.0f, 0.0f),
			NSMakePoint (3.0f, 2.0f),
	        rect);
	TEST (@"Touch bottom right", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (1.0f, 0.0f),
			NSMakePoint (1.0f, 3.0f),
	        rect);
	TEST (@"Along left side", result);

	result = lineSegmentIntersectsRect (
			NSMakePoint (0.0f, 1.0f),
			NSMakePoint (3.0f, 1.0f),
	        rect);
	TEST (@"Along bottom side", result);

	endTestBlock(@"lineSegmentIntersectsRect");
	[pool drain];
}

struct line_bezier_test {
	NSString *msg;
	NSPoint lstart;
	NSPoint lend;
	NSPoint c0;
	NSPoint c1;
	NSPoint c2;
	NSPoint c3;
	BOOL expectedResult;
	float expectedT;
	NSPoint expectedIntersect;
};

static struct line_bezier_test line_bezier_tests[] = {
	{
		@"Outside box",
		{0.0f, 0.0f},
		{1.0f, 0.0f},
		{0.0f, 1.0f},
		{0.0f, 2.0f},
		{1.0f, 2.0f},
		{1.0f, 1.0f},
		NO,
		-1.0f,
		{0.0f, 0.0f}
	},
	{
		@"Single intersect",
		{100.0f, 20.0f},
		{195.0f, 255.0f},
		{93.0f, 163.0f},
		{40.0f, 30.0f},
		{270.0f, 115.0f},
		{219.0f, 178.0f},
		YES,
		-0.4f,
		{129.391693f, 92.705772f}
	},
	{
		@"Double intersect",
		{100.0f, 20.0f},
		{195.0f, 255.0f},
		{93.0f, 163.0f},
		{40.0f, 30.0f},
		{270.0f, 115.0f},
		{154.0f, 212.0f},
		YES,
		-0.909f,
		{170.740646f,194.990021f}
	},
	{
		@"Near miss",
		{100.0f, 20.0f},
		{195.0f, 255.0f},
		{93.0f, 163.0f},
		{40.0f, 30.0f},
		{176.0f, 100.0f},
		{154.0f, 212.0f},
		NO,
		-1.0f,
		{0.0f,0.0f}
	}
};
static unsigned int n_line_bezier_tests = sizeof (line_bezier_tests) / sizeof (line_bezier_tests[0]);

void testLineSegmentIntersectsBezier() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"lineSegmentIntersectsBezier");

	for (unsigned int i = 0; i < n_line_bezier_tests; ++i) {
		NSPoint intersect;
		BOOL result = lineSegmentIntersectsBezier (
				line_bezier_tests[i].lstart,
				line_bezier_tests[i].lend,
				line_bezier_tests[i].c0,
				line_bezier_tests[i].c1,
				line_bezier_tests[i].c2,
				line_bezier_tests[i].c3,
				&intersect);
		if (result) {
			if (line_bezier_tests[i].expectedT < 0.0f) {
				assertPointsEqual (line_bezier_tests[i].msg, intersect, line_bezier_tests[i].expectedIntersect);
			} else {
				assertPointsEqual (line_bezier_tests[i].msg, intersect,
						bezierInterpolateFull (line_bezier_tests[i].expectedT, line_bezier_tests[i].c0, line_bezier_tests[i].c1, line_bezier_tests[i].c2, line_bezier_tests[i].c3));
			}
		} else {
			if (line_bezier_tests[i].expectedResult)
				fail (line_bezier_tests[i].msg);
			else
				pass (line_bezier_tests[i].msg);
		}
	}

BOOL lineSegmentIntersectsBezier (NSPoint lstart, NSPoint lend, NSPoint c0, NSPoint c1, NSPoint c2, NSPoint c3, NSPoint *result);
	endTestBlock(@"lineSegmentIntersectsBezier");
	[pool drain];
}

struct exit_point_test {
	NSString *msg;
	NSPoint rayStart;
	float angle;
	NSRect rect;
	NSPoint expected;
};

static struct exit_point_test exit_point_tests[] = {
	{
		@"0.0 rads",
		{0.0f, 0.0f},
		0.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{1.0f, 0.0f}
	},
	{
		@"pi/2 rads",
		{0.0f, 0.0f},
		M_PI / 2.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{0.0f, 1.0f}
	},
	{
		@"-pi/2 rads",
		{0.0f, 0.0f},
		-M_PI / 2.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{0.0f, -1.0f}
	},
	{
		@"pi rads",
		{0.0f, 0.0f},
		M_PI,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-1.0f, 0.0f}
	},
	{
		@"-pi rads",
		{0.0f, 0.0f},
		-M_PI,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-1.0f, 0.0f}
	},
	{
		@"pi/4 rads",
		{0.0f, 0.0f},
		M_PI / 4.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{1.0f, 1.0f}
	},
	{
		@"3pi/4 rads",
		{0.0f, 0.0f},
		(3.0f * M_PI) / 4.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-1.0f, 1.0f}
	},
	{
		@"-pi/4 rads",
		{0.0f, 0.0f},
		-M_PI / 4.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{1.0f, -1.0f}
	},
	{
		@"-3pi/4 rads",
		{0.0f, 0.0f},
		(-3.0f * M_PI) / 4.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-1.0f, -1.0f}
	},
	{
		@"pi/8 rads",
		{0.0f, 0.0f},
		M_PI / 8.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{1.0f, 0.414213562373095f}
	},
	{
		@"3pi/8 rads",
		{0.0f, 0.0f},
		3.0f * M_PI / 8.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{0.414213562373095f, 1.0f}
	},
	{
		@"-5pi/8 rads",
		{0.0f, 0.0f},
		-5.0f * M_PI / 8.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-0.414213562373095f, -1.0f}
	},
	{
		@"-7pi/8 rads",
		{0.0f, 0.0f},
		-7.0f * M_PI / 8.0f,
		{{-1.0f, -1.0f}, {2.0f, 2.0f}},
		{-1.0f, -0.414213562373095f}
	},
	{
		@"pi/8 rads; origin (1,1)",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{0.0f, 0.0f}, {2.0f, 2.0f}},
		{2.0f, 1.414213562373095f}
	},
	{
		@"7pi/8 rads; origin (-2,2)",
		{-2.0f, 2.0f},
		7.0f * M_PI / 8.0f,
		{{-3.0f, 1.0f}, {2.0f, 2.0f}},
		{-3.0f, 2.414213562373095f}
	},
	{
		@"pi/8 rads; origin (1,1); SW of box",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{1.0f, 1.0f}, {1.0f, 1.0f}},
		{2.0f, 1.414213562373095f}
	},
	{
		@"pi/8 rads; origin (1,1); SE of box",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{0.0f, 1.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"pi/8 rads; origin (1,1); NE of box",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{0.0f, 1.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"pi/8 rads; origin (1,1); NW of box",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{1.0f, 0.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"pi/8 rads; origin (1,1); N of box",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{0.5f, 0.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"7pi/8 rads; origin (1,1); N of box",
		{1.0f, 1.0f},
		7.0f * M_PI / 8.0f,
		{{0.5f, 0.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"-pi/8 rads; origin (1,1); S of box",
		{1.0f, 1.0f},
		-M_PI / 8.0f,
		{{0.5f, 1.0f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"-pi/8 rads; origin (1,1); E of box",
		{1.0f, 1.0f},
		-M_PI / 8.0f,
		{{0.0f, 0.5f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"-7pi/8 rads; origin (1,1); W of box",
		{1.0f, 1.0f},
		-7.0f * M_PI / 8.0f,
		{{1.0f, 0.5f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"7pi/8 rads; origin (1,1); W of box",
		{1.0f, 1.0f},
		7.0f * M_PI / 8.0f,
		{{1.0f, 0.5f}, {1.0f, 1.0f}},
		{1.0f, 1.0f}
	},
	{
		@"pi/8 rads; origin (1,1); leave through top",
		{1.0f, 1.0f},
		M_PI / 8.0f,
		{{0.9f, 0.1f}, {1.0f, 1.0f}},
		{1.2414213562373f, 1.1f}
	},
	{
		@"0 rads; origin (1,1); N of box",
		{1.0f, 1.0f},
		0.0f,
		{{0.5f, 0.0f}, {1.0f, 1.0f}},
		{1.5f, 1.0f}
	}
};
static unsigned int n_exit_point_tests = sizeof (exit_point_tests) / sizeof (exit_point_tests[0]);

void testFindExitPointOfRay() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"findExitPointOfRay");

	for (unsigned int i = 0; i < n_exit_point_tests; ++i) {
		NSPoint exitPoint = findExitPointOfRay (
				exit_point_tests[i].rayStart,
				exit_point_tests[i].angle,
				exit_point_tests[i].rect);
		assertPointsEqual (exit_point_tests[i].msg, exitPoint, exit_point_tests[i].expected);
	}

	endTestBlock(@"findExitPointOfRay");
	[pool drain];
}

#ifdef STAND_ALONE
void runTests() {
#else
void testMaths() {
#endif
	startTestBlock(@"maths");
	testRectAroundPoints();
	testRectAroundPointsWithPadding();
	testGoodAtan();
	testBezierInterpolate();
	testLineSegmentsIntersect();
	testLineSegmentIntersectsRect();
	testFindExitPointOfRay();
	testLineSegmentIntersectsBezier();
	endTestBlock(@"maths");
}

// vim:ft=objc:ts=4:sts=4:sw=4:noet
