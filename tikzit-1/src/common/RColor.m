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

#import "RColor.h"

RColor MakeSolidRColor (CGFloat red, CGFloat green, CGFloat blue) {
    return MakeRColor (red, green, blue, 1.0);
}

RColor MakeRColor (CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha) {
    RColor color;
    color.red = red;
    color.green = green;
    color.blue = blue;
    color.alpha = alpha;
    return color;
}

// vi:ft=objc:ts=4:noet:sts=4:sw=4
