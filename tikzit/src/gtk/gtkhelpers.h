//
//  gtkhelpers.h
//  TikZiT
//
//  Copyright 2010 Alex Merry. All rights reserved.
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
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//
#import "TZFoundation.h"
#include <gtk/gtk.h>
#import <gdk-pixbuf/gdk-pixbuf.h>

/**
 * Releases the Objective-C object pointed to by data
 *
 * Intended for use as a cleanup function in Glib/GObject-based
 * code.
 */
void release_obj (gpointer data);

NSString * gtk_editable_get_string (GtkEditable *editable, gint start, gint end);

GdkRectangle gdk_rectangle_from_ns_rect (NSRect rect);
NSRect gdk_rectangle_to_ns_rect (GdkRectangle rect);

void gtk_action_set_detailed_label (GtkAction *action, const gchar *baseLabel, const gchar *actionName);

gint tz_hijack_key_press (GtkWindow *win,
                          GdkEventKey *event,
                          gpointer user_data);

// Equivalent of GTK+3's gdk_pixbuf_get_from_surface()
GdkPixbuf * pixbuf_get_from_surface(cairo_surface_t *surface);

void tz_restore_window (GtkWindow *window, gint x, gint y, gint w, gint h);

// vim:ft=objc:sts=2:sw=2:et
