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

float roundToNearest(float stepSize, float val) {
	if (stepSize==0.0f) return val;
	else return round(val/stepSize)*stepSize;
}

float radiansToDegrees (float radians) {
    return (radians * 180.0f) / M_PI;
}

int normaliseAngleDeg (int degrees) {
	while (degrees >= 360) {
		degrees -= 360;
	}
	while (degrees <= -360) {
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


