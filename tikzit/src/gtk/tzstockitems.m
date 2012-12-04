/*
 * Copyright 2012  Alex Merry <dev@randomguy3.me.uk>
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

#include "tzstockitems.h"
#include <gtk/gtk.h>
#include <gdk-pixbuf/gdk-pixdata.h>

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpointer-sign"
#import "icondata.m"
#pragma GCC diagnostic pop

static GtkStockItem stock_items[] = {
    // gchar *stock_id;
    // gchar *label;
    // GdkModifierType modifier;
    // guint keyval;
    // gchar *translation_domain;
    { TIKZIT_STOCK_SELECT, "Select Tool", 0, 0, NULL },
    { TIKZIT_STOCK_CREATE_NODE, "Create Node Tool", 0, 0, NULL },
    { TIKZIT_STOCK_CREATE_EDGE, "Create Edge Tool", 0, 0, NULL },
    { TIKZIT_STOCK_BOUNDING_BOX, "Bounding Box Tool", 0, 0, NULL },
    { TIKZIT_STOCK_DRAG, "Drag Tool", 0, 0, NULL },
};
static guint n_stock_items = G_N_ELEMENTS (stock_items);

static void icon_factory_add_pixdata (GtkIconFactory *factory,
                                      const gchar *stock_id,
                                      const GdkPixdata *image_data) {

    GdkPixbuf *buf = gdk_pixbuf_from_pixdata (image_data, FALSE, NULL);
    GtkIconSet *icon_set = gtk_icon_set_new_from_pixbuf (buf);
    gtk_icon_factory_add (factory, stock_id, icon_set);
    gtk_icon_set_unref (icon_set);
    g_object_unref (G_OBJECT (buf));
}

void tz_register_stock_items() {
    gtk_stock_add_static (stock_items, n_stock_items);

    GtkIconFactory *factory = gtk_icon_factory_new ();
    icon_factory_add_pixdata (factory, TIKZIT_STOCK_SELECT, &select_rectangular);
    icon_factory_add_pixdata (factory, TIKZIT_STOCK_CREATE_NODE, &draw_ellipse);
    icon_factory_add_pixdata (factory, TIKZIT_STOCK_CREATE_EDGE, &draw_path);
    icon_factory_add_pixdata (factory, TIKZIT_STOCK_BOUNDING_BOX, &transform_crop_and_resize);
    icon_factory_add_pixdata (factory, TIKZIT_STOCK_DRAG, &transform_move);
    gtk_icon_factory_add_default (factory);
}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
