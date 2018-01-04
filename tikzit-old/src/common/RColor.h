/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#import <Foundation/Foundation.h>

#ifndef CGFloat
#define CGFloat float
#endif

/**
 * A lightweight color structure used by RenderContext
 *
 * This is mainly to avoid the overhead of ColorRGB when
 * rendering things not based on a NodeStyle
 *
 * All values range from 0.0f to 1.0f.
 */
typedef struct {
    CGFloat red;
    CGFloat green;
    CGFloat blue;
    CGFloat alpha;
}
RColor;

/** Solid white */
static const RColor WhiteRColor __attribute__((unused)) = {1.0, 1.0, 1.0, 1.0};
/** Solid black */
static const RColor BlackRColor __attribute__((unused)) = {0.0, 0.0, 0.0, 1.0};

/** Create a color with alpha set to 1.0 */
RColor MakeSolidRColor (CGFloat red, CGFloat green, CGFloat blue);
/** Create a color */
RColor MakeRColor (CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha);

// vi:ft=objc:noet:ts=4:sts=4:sw=4
