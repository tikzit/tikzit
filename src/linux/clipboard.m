/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
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

#import "clipboard.h"

GdkAtom utf8_atom;
GdkAtom tikzit_picture_atom;

void clipboard_init () {
    if (utf8_atom == GDK_NONE) {
        utf8_atom = gdk_atom_intern ("UTF8_STRING", FALSE);
    }
    if (tikzit_picture_atom == GDK_NONE) {
        tikzit_picture_atom = gdk_atom_intern ("TIKZITPICTURE", FALSE);
    }
}

ClipboardGraphData *clipboard_graph_data_new (Graph *graph) {
    ClipboardGraphData *data = g_new (ClipboardGraphData, 1);
    data->graph = [graph retain];
    data->tikz = NULL;
    data->tikz_length = 0;
    return data;
}

void clipboard_graph_data_free (ClipboardGraphData *data) {
    [data->graph release];
    if (data->tikz) {
        g_free (data->tikz);
    }
    g_free (data);
}

void clipboard_graph_data_convert (ClipboardGraphData *data) {
    if (data->graph != nil && !data->tikz) {
        data->tikz = g_strdup ([[data->graph tikz] UTF8String]);
        data->tikz_length = strlen (data->tikz);
        [data->graph release];
        data->graph = nil;
    }
}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
