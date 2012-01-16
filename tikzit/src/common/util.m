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

void lineCoeffsFromPoints(NSPoint p1, NSPoint p2, float *A, float *B, float *C) {
	*A = p2.y - p1.y;
	*B = p1.x - p2.x;
	*C = (*A) * p1.x + (*B) * p1.y;
}

static BOOL lineSegmentContainsPoint(NSPoint l1, NSPoint l2, float x, float y) {
	float maxX = l1.x > l2.x ? l2.x : l1.x;
	float minX = l1.x > l2.x ? l1.x : l2.x;
	float maxY = l1.y > l2.y ? l2.y : l1.y;
	float minY = l1.y > l2.y ? l1.y : l2.y;
	return x >= minX && x <= maxX && y >= minY && y <= maxY;
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

float roundToNearest(float stepSize, float val) {
	if (stepSize==0.0f) return val;
	else return round(val/stepSize)*stepSize;
}

float radiansToDegrees (float radians) {
    return (radians * 180.0f) / M_PI;
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

static char ahex[] =
{'a','b','c','d','e','f','g','h','i','j',
 'A','B','C','D','E','F'};

NSString *alphaHex(unsigned short sh) {
	if (sh > 255) return @"!!";
	return [NSString stringWithFormat:@"%c%c", ahex[sh/16], ahex[sh%16]];
}


// vi:ft=objc:noet:ts=4:sts=4:sw=4
