/*
 * Copyright 2012  Alex Merry <alex.merry@kdemail.net>
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

#import "logo.h"
#include <gdk-pixbuf/gdk-pixdata.h>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpointer-sign"
#import "logodata.m"
#pragma GCC diagnostic pop

static GdkPixbuf *pixbufCache[LOGO_SIZE_COUNT];

GdkPixbuf *get_logo (LogoSize size) {
    const GdkPixdata *data = NULL;
    switch (size) {
        case LOGO_SIZE_16:
            data = &logo16;
            break;
        case LOGO_SIZE_24:
            data = &logo24;
            break;
        case LOGO_SIZE_32:
            data = &logo32;
            break;
        case LOGO_SIZE_48:
            data = &logo48;
            break;
        case LOGO_SIZE_64:
            data = &logo64;
            break;
        case LOGO_SIZE_128:
            data = &logo128;
            break;
        default:
            return NULL;
    };
    if (pixbufCache[size]) {
        g_object_ref (pixbufCache[size]);
        return pixbufCache[size];
    } else {
        GdkPixbuf *buf = gdk_pixbuf_from_pixdata (data, FALSE, NULL);
        pixbufCache[size] = buf;
        g_object_add_weak_pointer (G_OBJECT (buf), (void**)(&(pixbufCache[size])));
        return buf;
    }
}

// vim:ft=objc:ts=8:et:sts=4:sw=4

