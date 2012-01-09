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
#import <glib.h>

@interface NSString(Glib)
/**
 * Initialise a string with a string in the GLib filename encoding
 */
- (id) initWithGlibFilename:(const gchar *)filename;
/**
 * Create a string from a string in the GLib filename encoding
 */
+ (id) stringWithGlibFilename:(const gchar *)filename;
/**
 * Get a copy of the string in GLib filename encoding.
 *
 * This will need to be freed with g_free.
 */
- (gchar*)glibFilename;
/**
 * Get a copy of the string as a GLib URI
 *
 * This will need to be freed with g_free.
 */
- (gchar*)glibUriWithError:(NSError**)error;
/**
 * Get a copy of the string as a GLib URI
 *
 * This will need to be freed with g_free.
 */
- (gchar*)glibUri;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
