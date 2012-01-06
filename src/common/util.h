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

/*!
 @brief      Compute a bounding rectangle for two given points.
 @param      p1 a point.
 @param      p2 another point.
 @result     A bounding rectangle for p1 and p2.
 */
NSRect NSRectAroundPoints(NSPoint p1, NSPoint p2);

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
float bezierInterpolate(float dist, float c0, float c1, float c2, float c3);


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
 @brief      Normalises an angle (in degrees) to fall between -359 and 359
 */
int normaliseAngleDeg (int degrees);

/*!
 @brief      Express a byte as alpha-only hex, with digits (0..16) -> (a..jA..F)
 @param      sh A number 0-255
 @result     A string 'aa'-'FF'
 */
NSString *alphaHex(unsigned short sh);

// vi:ft=objc:noet:ts=4:sts=4:sw=4
