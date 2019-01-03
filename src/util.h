/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/*!
  * Various utility functions, mostly for mathematical calculation.
  */

#ifndef UTIL_H
#define UTIL_H

#include <QPoint>
#include <QString>
#include <QColor>
#include <cmath>

#ifndef M_PI
#define M_PI 3.14159265358979323846264338327950288
#endif

// interpolate on a cubic bezier curve
qreal bezierInterpolate(qreal dist, qreal c0, qreal c1, qreal c2, qreal c3);
QPointF bezierInterpolateFull (qreal dist, QPointF c0, QPointF c1, QPointF c2, QPointF c3);

// rounding
qreal roundToNearest(qreal stepSize, qreal val);
qreal radiansToDegrees (qreal radians);
bool almostZero(qreal f);
bool almostEqual(qreal f1, qreal f2);
QString floatToString(qreal f);

// angles
qreal degreesToRadians(qreal degrees);
int normaliseAngleDeg (int degrees);
qreal normaliseAngleRad (qreal rads);

#endif // UTIL_H
