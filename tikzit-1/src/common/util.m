//
//  util.m
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

#import "util.h"
#import "math.h"

static BOOL fuzzyCompare(float f1, float f2) {
	return (ABS(f1 - f2) <= 0.00001f * MIN(ABS(f1), ABS(f2)));
}

NSRect NSRectWithPoint(NSRect rect, NSPoint p) {
	CGFloat minX = NSMinX(rect);
	CGFloat maxX = NSMaxX(rect);
	CGFloat minY = NSMinY(rect);
	CGFloat maxY = NSMaxY(rect);
	if (p.x < minX) {
		minX = p.x;
	} else if (p.x > maxX) {
		maxX = p.x;
	}
	if (p.y < minY) {
		minY = p.y;
	} else if (p.y > maxY) {
		maxY = p.y;
	}
	return NSMakeRect(minX, minY, maxX - minX, maxY - minY);
}

NSRect NSRectAroundPointsWithPadding(NSPoint p1, NSPoint p2, float padding) {
	return NSMakeRect(MIN(p1.x,p2.x)-padding,
					  MIN(p1.y,p2.y)-padding,
					  ABS(p2.x-p1.x)+(2.0f*padding),
					  ABS(p2.y-p1.y)+(2.0f*padding));
}

NSRect NSRectAroundPoints(NSPoint p1, NSPoint p2) {
	return NSRectAroundPointsWithPadding(p1, p2, 0.0f);
}

NSRect NSRectAround4PointsWithPadding(NSPoint p1, NSPoint p2, NSPoint p3, NSPoint p4, float padding) {
	float leftMost = MIN(p1.x, p2.x);
	leftMost = MIN(leftMost, p3.x);
	leftMost = MIN(leftMost, p4.x);
	float rightMost = MAX(p1.x, p2.x);
	rightMost = MAX(rightMost, p3.x);
	rightMost = MAX(rightMost, p4.x);
	float topMost = MIN(p1.y, p2.y);
	topMost = MIN(topMost, p3.y);
	topMost = MIN(topMost, p4.y);
	float bottomMost = MAX(p1.y, p2.y);
	bottomMost = MAX(bottomMost, p3.y);
	bottomMost = MAX(bottomMost, p4.y);
	return NSMakeRect(leftMost-padding,
					  topMost-padding,
					  (rightMost - leftMost)+(2.0f*padding),
					  (bottomMost - topMost)+(2.0f*padding));
}

NSRect NSRectAround4Points(NSPoint p1, NSPoint p2, NSPoint p3, NSPoint p4) {
	return NSRectAround4PointsWithPadding(p1, p2, p3, p4, 0.0f);
}

float NSDistanceBetweenPoints(NSPoint p1, NSPoint p2) {
	float dx = p2.x - p1.x;
	float dy = p2.y - p1.y;
	return sqrt(dx * dx + dy * dy);
}

float good_atan(float dx, float dy) {
	if (dx > 0) {
		return atan(dy/dx);
	} else if (dx < 0) {
		return M_PI + atan(dy/dx);
	} else {
		if (dy > 0) return 0.5 * M_PI;
		else if (dy < 0) return 1.5 * M_PI;
		else return 0;
	}
}

// interpolate on a cubic bezier curve
float bezierInterpolate(float dist, float c0, float c1, float c2, float c3) {
	float distp = 1 - dist;
	return	(distp*distp*distp) * c0 +
			3 * (distp*distp) * dist * c1 +
			3 * (dist*dist) * distp * c2 +
			(dist*dist*dist) * c3;
}

NSPoint bezierInterpolateFull (float dist, NSPoint c0, NSPoint c1, NSPoint c2, NSPoint c3) {
	return NSMakePoint (bezierInterpolate (dist, c0.x, c1.x, c2.x, c3.x),
	                    bezierInterpolate (dist, c0.y, c1.y, c2.y, c3.y));
}

static void lineCoeffsFromPoints(NSPoint p1, NSPoint p2, float *A, float *B, float *C) {
	*A = p2.y - p1.y;
	*B = p1.x - p2.x;
	*C = (*A) * p1.x + (*B) * p1.y;
}

static void lineCoeffsFromPointAndAngle(NSPoint p, float angle, float *A, float *B, float *C) {
	*A = sin (angle);
	*B = -cos (angle);
	*C = (*A) * p.x + (*B) * p.y;
}

static BOOL lineSegmentContainsPoint(NSPoint l1, NSPoint l2, float x, float y) {
	float minX = MIN(l1.x, l2.x);
	float maxX = MAX(l1.x, l2.x);
	float minY = MIN(l1.y, l2.y);
	float maxY = MAX(l1.y, l2.y);
	return (x >= minX || fuzzyCompare (x, minX)) &&
	       (x <= maxX || fuzzyCompare (x, maxX)) &&
		   (y >= minY || fuzzyCompare (y, minY)) &&
		   (y <= maxY || fuzzyCompare (y, maxY));
}

BOOL lineSegmentsIntersect(NSPoint l1start, NSPoint l1end, NSPoint l2start, NSPoint l2end, NSPoint *result) {
	// Ax + By = C
	float A1, B1, C1;
	lineCoeffsFromPoints(l1start, l1end, &A1, &B1, &C1);
	float A2, B2, C2;
	lineCoeffsFromPoints(l2start, l2end, &A2, &B2, &C2);

	float det = A1*B2 - A2*B1;
	if (det == 0.0f) {
		// parallel
		return NO;
	} else {
		float x = (B2*C1 - B1*C2)/det;
		float y = (A1*C2 - A2*C1)/det;

		if (lineSegmentContainsPoint(l1start, l1end, x, y) &&
				lineSegmentContainsPoint(l2start, l2end, x, y)) {
			if (result) {
				(*result).x = x;
				(*result).y = y;
			}
			return YES;
		}
	}
	return NO;
}

BOOL lineSegmentIntersectsBezier (NSPoint lstart, NSPoint lend, NSPoint c0, NSPoint c1, NSPoint c2, NSPoint c3, NSPoint *result) {
	NSRect curveBounds = NSRectAround4Points(c0, c1, c2, c3);
	if (!lineSegmentIntersectsRect(lstart, lend, curveBounds))
		return NO;

	const int divisions = 20;
	const float chunkSize = 1.0f/(float)divisions;
	float chunkStart = 0.0f;
	BOOL found = NO;

	for (int i = 0; i < divisions; ++i) {
		float chunkEnd = chunkStart + chunkSize;

		NSPoint p1 = bezierInterpolateFull (chunkStart, c0, c1, c2, c3);
		NSPoint p2 = bezierInterpolateFull (chunkEnd, c0, c1, c2, c3);

		NSPoint p;
		if (lineSegmentsIntersect (lstart, lend, p1, p2, &p)) {
			lstart = p;
			found = YES;
		}

		chunkStart = chunkEnd;
	}
	if (found && result) {
		*result = lstart;
	}
	return found;
}

BOOL lineSegmentIntersectsRect(NSPoint lineStart, NSPoint lineEnd, NSRect rect) {
	const float rectMaxX = NSMaxX(rect);
	const float rectMinX = NSMinX(rect);
	const float rectMaxY = NSMaxY(rect);
	const float rectMinY = NSMinY(rect);

	// check if the segment is entirely to one side of the rect
	if (lineStart.x > rectMaxX && lineEnd.x > rectMaxX) {
		return NO;
	}
	if (lineStart.x < rectMinX && lineEnd.x < rectMinX) {
		return NO;
	}
	if (lineStart.y > rectMaxY && lineEnd.y > rectMaxY) {
		return NO;
	}
	if (lineStart.y < rectMinY && lineEnd.y < rectMinY) {
		return NO;
	}

	// Now check whether the (infinite) line intersects the rect
	// (if it does, so does the segment, due to above checks)

	// Ax + By = C
	float A, B, C;
	lineCoeffsFromPoints(lineStart, lineEnd, &A, &B, &C);

	const float tlVal = A * rectMinX + B * rectMaxY - C;
	const float trVal = A * rectMaxX + B * rectMaxY - C;
	const float blVal = A * rectMinX + B * rectMinY - C;
	const float brVal = A * rectMaxX + B * rectMinY - C;

	if (tlVal < 0 && trVal < 0 && blVal < 0 && brVal < 0) {
		// rect below line
		return NO;
	}
	if (tlVal > 0 && trVal > 0 && blVal > 0 && brVal > 0) {
		// rect above line
		return NO;
	}

	return YES;
}

NSPoint findExitPointOfRay (NSPoint p, float angle_rads, NSRect rect) {
	const float rectMinX = NSMinX (rect);
	const float rectMaxX = NSMaxX (rect);
	const float rectMinY = NSMinY (rect);
	const float rectMaxY = NSMaxY (rect);

	const float angle = normaliseAngleRad (angle_rads);

	// special case the edges
	if (p.y == rectMaxY && angle > 0 && angle < M_PI) {
		// along the top of the box
		return p;
	}
	if (p.y == rectMinY && angle < 0 && angle > -M_PI) {
		// along the bottom of the box
		return p;
	}
	if (p.x == rectMaxX && angle > -M_PI/2.0f && angle < M_PI/2.0f) {
		// along the right of the box
		return p;
	}
	if (p.x == rectMinX && (angle > M_PI/2.0f || angle < -M_PI/2.0f)) {
		// along the left of the box
		return p;
	}

	float A1, B1, C1;
	lineCoeffsFromPointAndAngle(p, angle, &A1, &B1, &C1);
	//NSLog(@"Ray is %fx + %fy = %f", A1, B1, C1);

	const float tlAngle = normaliseAngleRad (good_atan (rectMinX - p.x, rectMaxY - p.y));
	const float trAngle = normaliseAngleRad (good_atan (rectMaxX - p.x, rectMaxY - p.y));
	if (angle <= tlAngle && angle >= trAngle) {
		// exit top
		float A2, B2, C2;
		lineCoeffsFromPoints(NSMakePoint (rectMinX, rectMaxY),
		                     NSMakePoint (rectMaxX, rectMaxY),
							 &A2, &B2, &C2);
		float det = A1*B2 - A2*B1;
		NSCAssert(det != 0.0f, @"Parallel lines?");
		NSPoint intersect = NSMakePoint ((B2*C1 - B1*C2)/det,
		                                 (A1*C2 - A2*C1)/det);
		return intersect;
	}

	const float brAngle = normaliseAngleRad (good_atan (rectMaxX - p.x, rectMinY - p.y));
	if (angle <= trAngle && angle >= brAngle) {
		// exit right
		float A2, B2, C2;
		lineCoeffsFromPoints(NSMakePoint (rectMaxX, rectMaxY),
		                     NSMakePoint (rectMaxX, rectMinY),
							 &A2, &B2, &C2);
		//NSLog(@"Edge is %fx + %fy = %f", A2, B2, C2);
		float det = A1*B2 - A2*B1;
		NSCAssert(det != 0.0f, @"Parallel lines?");
		NSPoint intersect = NSMakePoint ((B2*C1 - B1*C2)/det,
		                                 (A1*C2 - A2*C1)/det);
		return intersect;
	}

	const float blAngle = normaliseAngleRad (good_atan (rectMinX - p.x, rectMinY - p.y));
	if (angle <= brAngle && angle >= blAngle) {
		// exit bottom
		float A2, B2, C2;
		lineCoeffsFromPoints(NSMakePoint (rectMaxX, rectMinY),
		                     NSMakePoint (rectMinX, rectMinY),
							 &A2, &B2, &C2);
		float det = A1*B2 - A2*B1;
		NSCAssert(det != 0.0f, @"Parallel lines?");
		NSPoint intersect = NSMakePoint ((B2*C1 - B1*C2)/det,
		                                 (A1*C2 - A2*C1)/det);
		return intersect;
	} else {
		// exit left
		float A2, B2, C2;
		lineCoeffsFromPoints(NSMakePoint (rectMinX, rectMaxY),
		                     NSMakePoint (rectMinX, rectMinY),
							 &A2, &B2, &C2);
		float det = A1*B2 - A2*B1;
		NSCAssert(det != 0.0f, @"Parallel lines?");
		NSPoint intersect = NSMakePoint ((B2*C1 - B1*C2)/det,
		                                 (A1*C2 - A2*C1)/det);
		return intersect;
	}
}

float roundToNearest(float stepSize, float val) {
	if (stepSize==0.0f) return val;
	else return round(val/stepSize)*stepSize;
}

float radiansToDegrees (float radians) {
    return (radians * 180.0f) / M_PI;
}

float degreesToRadians(float degrees) {
    return (degrees * M_PI) / 180.0f;
}

int normaliseAngleDeg (int degrees) {
	while (degrees > 180) {
		degrees -= 360;
	}
	while (degrees <= -180) {
		degrees += 360;
	}
	return degrees;
}

float normaliseAngleRad (float rads) {
	while (rads > M_PI) {
		rads -= 2 * M_PI;
	}
	while (rads <= -M_PI) {
		rads += 2 * M_PI;
	}
	return rads;
}

static char ahex[] =
{'a','b','c','d','e','f','g','h','i','j',
 'A','B','C','D','E','F'};

NSString *alphaHex(unsigned short sh) {
	if (sh > 255) return @"!!";
	return [NSString stringWithFormat:@"%c%c", ahex[sh/16], ahex[sh%16]];
}

const char *find_start_of_nth_line (const char * string, int line) {
	int l = 0;
	const char *lineStart = string;
	while (*lineStart && l < line) {
		while (*lineStart && *lineStart != '\n') {
			++lineStart;
		}
		if (*lineStart) {
			++l;
			++lineStart;
		}
	}
	return lineStart;
}

NSString *formatFloat(CGFloat f, int maxdps) {
	NSMutableString *result = [NSMutableString
		stringWithFormat:@"%.*f", maxdps, f];
	// delete trailing zeros
	NSUInteger lastPos = [result length] - 1;
	NSUInteger firstDigit = ([result characterAtIndex:0] == '-') ? 1 : 0;
	while (lastPos > firstDigit) {
		if ([result characterAtIndex:lastPos] == '0') {
			[result deleteCharactersInRange:NSMakeRange(lastPos, 1)];
			lastPos -= 1;
		} else {
			break;
		}
	}
	if ([result characterAtIndex:lastPos] == '.') {
		[result deleteCharactersInRange:NSMakeRange(lastPos, 1)];
		lastPos -= 1;
	}
	if ([@"-0" isEqualToString:result])
		return @"0";
	else
		return result;
}

// vi:ft=objc:noet:ts=4:sts=4:sw=4
