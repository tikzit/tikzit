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

#include "util.h"


qreal bezierInterpolate(qreal dist, qreal c0, qreal c1, qreal c2, qreal c3) {
    qreal distp = 1 - dist;
    return  (distp*distp*distp) * c0 +
            3 * (distp*distp) * dist * c1 +
            3 * (dist*dist) * distp * c2 +
            (dist*dist*dist) * c3;
}

QPointF bezierInterpolateFull (qreal dist, QPointF c0, QPointF c1, QPointF c2, QPointF c3) {
    return QPointF(bezierInterpolate (dist, c0.x(), c1.x(), c2.x(), c3.x()),
                   bezierInterpolate (dist, c0.y(), c1.y(), c2.y(), c3.y()));
}


qreal roundToNearest(qreal stepSize, qreal val) {
    if (stepSize==0.0) return val;
    else return round(val/stepSize)*stepSize;
}

qreal radiansToDegrees (qreal radians) {
    return (radians * 180.0) / M_PI;
}

qreal degreesToRadians(qreal degrees) {
    return (degrees * M_PI) / 180.0;
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

qreal normaliseAngleRad (qreal rads) {
    while (rads > M_PI) {
        rads -= 2 * M_PI;
    }
    while (rads <= -M_PI) {
        rads += 2 * M_PI;
    }
    return rads;
}

bool almostZero(qreal f) {
    return (f >= -0.000001 && f <= 0.000001);
}

bool almostEqual(qreal f1, qreal f2) {
    return almostZero(f1 - f2);
}

// convert qreal to string, squashing very small qreals to zero
QString floatToString(qreal f) {
    if (almostZero(f)) return "0";
    else return QString::number(f);
}


static QList<QString> texConstantNames;
static QList<QString> texConstantCodes;
static QList<QString> texModifierNames;


void initTexConstants() {
    texConstantNames
        << "\\alpha"  << "\\beta"  << "\\gamma" << "\\delta"   << "\\epsilon"
        << "\\zeta"   << "\\eta"   << "\\theta" << "\\iota"    << "\\kappa"
        << "\\lambda" << "\\mu"    << "\\nu"    << "\\xi"      << "\\pi"
        << "\\rho"    << "\\sigma" << "\\tau"   << "\\upsilon" << "\\phi"
        << "\\chi"    << "\\psi"   << "\\omega"

        << "\\Gamma"  << "\\Delta" << "\\Theta"   << "\\Lambda" << "\\Xi"
        << "\\Pi"     << "\\Sigma" << "\\Upsilon" << "\\Phi"    << "\\Psi"
        << "\\Omega"

        << "\\pm" << "\\to" << "\\Rightarrow" << "\\Leftrightarrow" << "\\forall"
        << "\\partial" << "\\exists" << "\\emptyset" << "\\nabla" << "\\in"
        << "\\notin" << "\\prod" << "\\sum" << "\\surd" << "\\infty"
        << "\\wedge" << "\\vee" << "\\cap" << "\\cup" << "\\int"
        << "\\approx" << "\\neq" << "\\equiv" << "\\leq" << "\\geq"
        << "\\subset" << "\\supset"

        << "\\ldots" << "\\vdots" << "\\cdots" << "\\ddots" << "\\iddots"
        << "\\cdot";

    texConstantCodes
        << "\u03b1" << "\u03b2" << "\u03b3" << "\u03b4" << "\u03b5"
        << "\u03b6" << "\u03b7" << "\u03b8" << "\u03b9" << "\u03ba"
        << "\u03bb" << "\u03bc" << "\u03bd" << "\u03be" << "\u03c0"
        << "\u03c1" << "\u03c3" << "\u03c4" << "\u03c5" << "\u03c6"
        << "\u03c7" << "\u03c8" << "\u03c9"

        << "\u0393" << "\u0394" << "\u0398" << "\u039b" << "\u039e"
        << "\u03a0" << "\u03a3" << "\u03a5" << "\u03a6" << "\u03a8"
        << "\u03a9"

        << "\u00b1" << "\u2192" << "\u21d2" << "\u21d4" << "\u2200"
        << "\u2202" << "\u2203" << "\u2205" << "\u2207" << "\u2208"
        << "\u2209" << "\u220f" << "\u2211" << "\u221a" << "\u221e"
        << "\u2227" << "\u2228" << "\u2229" << "\u222a" << "\u222b"
        << "\u2248" << "\u2260" << "\u2261" << "\u2264" << "\u2265"
        << "\u2282" << "\u2283"

        << "\u2026" << "\u22ee" << "\u22ef" << "\u22f1" << "\u22f0"
        << "\u22c5";

    texModifierNames
        << "\\tiny"
        << "\\scriptsize"
        << "\\footnotesize"
        << "\\small"
        << "\\normalsize"
        << "\\large"
        << "\\Large"
        << "\\LARGE"
        << "\\huge"
        << "\\Huge";
}

QString replaceTexConstants(QString s) {
    QString s1 = s;
    for (int i = 0; i < texConstantNames.length(); ++i) {
        s1 = s1.replace(texConstantNames[i], texConstantCodes[i]);
    }

    for (int i = 0; i < texModifierNames.length(); ++i) {
        s1 = s1.replace(texModifierNames[i], "");
    }

    if (s1.startsWith('$') && s1.endsWith('$')) {
        s1 = s1.mid(1, s1.length()-2);
    }

    return s1;
}




