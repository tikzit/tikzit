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

#import "cairo_helpers.h"

void cairo_ns_rectangle (cairo_t* cr, NSRect rect) {
    cairo_rectangle (cr, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
}

void cairo_set_source_rcolor (cairo_t* cr, RColor color) {
    cairo_set_source_rgba (cr, color.red, color.green, color.blue, color.alpha);
}

// vim:ft=objc:sts=4:sw=4:et
