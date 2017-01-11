/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
 * Copyright 2010  Chris Heunen
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

#import "ColorRGB+Gtk.h"

// 257 = 65535/255
// GdkColor values run from 0 to 65535, not from 0 to 255
#define GDK_FACTOR 257

@implementation ColorRGB (Gtk)

+ (ColorRGB*) colorWithGdkColor:(GdkColor)color {
    return [ColorRGB colorWithRed:color.red/GDK_FACTOR green:color.green/GDK_FACTOR blue:color.blue/GDK_FACTOR];
}

- (id) initWithGdkColor:(GdkColor)color {
    return [self initWithRed:color.red/GDK_FACTOR green:color.green/GDK_FACTOR blue:color.blue/GDK_FACTOR];
}

- (GdkColor) gdkColor {
    GdkColor color;
    color.pixel = 0;
    color.red = GDK_FACTOR * [self red];
    color.green = GDK_FACTOR * [self green];
    color.blue = GDK_FACTOR * [self blue];
    return color;
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
