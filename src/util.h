/*!
  * Various utility functions, mostly for mathematical calculation.
  */

#ifndef UTIL_H
#define UTIL_H

#include <QPoint>
#include <cmath>

// interpolate on a cubic bezier curve
float bezierInterpolate(float dist, float c0, float c1, float c2, float c3);
QPointF bezierInterpolateFull (float dist, QPointF c0, QPointF c1, QPointF c2, QPointF c3);

// rounding
float roundToNearest(float stepSize, float val);
float radiansToDegrees (float radians);

// angles
float degreesToRadians(float degrees);
int normaliseAngleDeg (int degrees);
float normaliseAngleRad (float rads);

#endif // UTIL_H
