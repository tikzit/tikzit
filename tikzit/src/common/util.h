//
//  util.h
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

#import <Foundation/Foundation.h>

#include <math.h>

#ifndef M_PI
#define M_PI 3.141592654
#endif

#ifndef MAX
#define MAX(a,b) (((a) > (b)) ? (a) : (b))
#endif

#ifndef MIN
#define MIN(a,b) (((a) < (b)) ? (a) : (b))
#endif

/*!
 @brief      Compute a bounding rectangle for two given points.
 @param      p1 a point.
 @param      p2 another point.
 @result     A bounding rectangle for p1 and p2.
 */
NSRect NSRectAroundPoints(NSPoint p1, NSPoint p2);

/*!
 @brief      Compute a bounding rectangle for two given points.
 @param      rect the base rectangle
 @param      the point to ensure is included
 @result     A rectangle containing rect and p
 */
NSRect NSRectWithPoint(NSRect rect, NSPoint p);

/*!
 @brief      Compute a bounding rectangle for two given points with a given padding.
 @param      p1 a point.
 @param      p2 another point.
 @param      padding a padding.
 @result     A bounding rectangle for p1 and p2 with padding.
 */
NSRect NSRectAroundPointsWithPadding(NSPoint p1, NSPoint p2, float padding);

/*!
 @brief      Compute a bounding rectangle for four given points.
 @result     A bounding rectangle for p1, p2, p3 and p4.
 */
NSRect NSRectAround4Points(NSPoint p1, NSPoint p2, NSPoint p3, NSPoint p4);

/*!
 @brief      Compute a bounding rectangle for four given points.
 @param      padding the amount to pad the rectangle
 @result     A bounding rectangle for p1, p2, p3 and p4 with padding
 */
NSRect NSRectAround4PointsWithPadding(NSPoint p1, NSPoint p2, NSPoint p3, NSPoint p4, float padding);

/*!
 @brief      Find the distance between two points
 @param p1   The first point
 @param p2   The second point
 @result     The distance between p1 and p2
 */
float NSDistanceBetweenPoints(NSPoint p1, NSPoint p2);

/*!
 @brief      Compute the 'real' arctan for two points. Always succeeds and gives a good angle,
             regardless of sign, zeroes, etc.
 @param      dx the x distance between points.
 @param      dy the y distance between points.
 @result     An angle in radians.
 */
float good_atan(float dx, float dy);

/*!
 @brief      Interpolate along a bezier curve to the given distance. To find the x coord,
             use the relavant x coordinates for c0-c3, and for y use the y's.
 @param      dist a distance from 0 to 1 spanning the whole curve.
 @param      c0 the x (resp. y) coordinate of the start point.
 @param      c1 the x (resp. y) coordinate of the first control point.
 @param      c2 the x (resp. y) coordinate of the second control point.
 @param      c3 the x (resp. y) coordinate of the end point.
 @result     The x (resp. y) coordinate of the point at 'dist'.
 */
float bezierInterpolate (float dist, float c0, float c1, float c2, float c3);

/*!
 @brief      Interpolate along a bezier curve to the given distance.
 @param      dist a distance from 0 to 1 spanning the whole curve.
 @param      c0 the x start point.
 @param      c1 the x first control point.
 @param      c2 the x second control point.
 @param      c3 the x end point.
 @result     The point at 'dist'.
 */
NSPoint bezierInterpolateFull (float dist, NSPoint c0, NSPoint c1, NSPoint c2, NSPoint c3);

/*!
 * @brief          Find whether two line segments intersect
 * @param l1start  The starting point of line segment 1
 * @param l1end    The ending point of line segment 1
 * @param l2start  The starting point of line segment 2
 * @param l2end    The ending point of line segment 2
 * @param result   A location to store the intersection point
 * @result         YES if they intersect, NO if they do not
 */
BOOL lineSegmentsIntersect (NSPoint l1start, NSPoint l1end, NSPoint l2start, NSPoint l2end, NSPoint *result);

/*!
 * @brief         Find whether a line segment intersects a bezier curve
 * @detail        Always finds the intersection furthest along the line segment
 * @param lstart  The starting point of the line segment
 * @param lend    The ending point of the line segment
 * @param c0      The starting point of the bezier curve
 * @param c1      The first control point of the bezier curve
 * @param c2      The second control point of the bezier curve
 * @param c3      The ending point of the bezier curve
 * @param result  A location to store the intersection point
 * @result        YES if they intersect, NO if they do not
 */
BOOL lineSegmentIntersectsBezier (NSPoint lstart, NSPoint lend, NSPoint c0, NSPoint c1, NSPoint c2, NSPoint c3, NSPoint *result);

/*!
 * @brief            Find whether a line segment enters a rectangle
 * @param lineStart  The starting point of the line segment
 * @param lineEnd    The ending point of the line segment
 * @param rect       The rectangle
 * @result           YES if they intersect, NO if they do not
 */
BOOL lineSegmentIntersectsRect (NSPoint lineStart, NSPoint lineEnd, NSRect rect);

/*!
 * @brief            Find where a ray exits a rectangle
 * @param rayStart   The starting point of the ray; must be contained in rect
 * @param angle_rads The angle of the ray, in radians
 * @param rect       The rectangle
 * @result           The point at which the ray leaves the rect
 */
NSPoint findExitPointOfRay (NSPoint rayStart, float angle_rads, NSRect rect);

/*!
 @brief      Round val to nearest stepSize
 @param      stepSize the courseness
 @param      val a value to round
 */
float roundToNearest(float stepSize, float val);

/*!
 @brief      Convert radians into degrees
 */
float radiansToDegrees(float radians);

/*!
 @brief      Convert degrees into radians
 */
float degreesToRadians(float degrees);

/*!
 @brief      Normalises an angle (in degrees) to fall between -179 and 180
 */
int normaliseAngleDeg (int degrees);

/*!
 @brief      Normalises an angle (in radians) to fall in the range (-pi,pi]
 */
float normaliseAngleRad (float rads);

/*!
 @brief      Express a byte as alpha-only hex, with digits (0..16) -> (a..jA..F)
 @param      sh A number 0-255
 @result     A string 'aa'-'FF'
 */
NSString *alphaHex(unsigned short sh);

// vi:ft=objc:noet:ts=4:sts=4:sw=4
