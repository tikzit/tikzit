/* GIMP - The GNU Image Manipulation Program
 * Copyright (C) 1995 Spencer Kimball and Peter Mattis
 *
 * tztoolpalette.c, based on gimptoolpalette.c
 * Copyright (C) 2010 Michael Natterer <mitch@gimp.org>
 * Copyright (C) 2012 Alex Merry <alex.merry@kdemail.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <gtk/gtk.h>

#include "tztoolpalette.h"


#define DEFAULT_TOOL_ICON_SIZE GTK_ICON_SIZE_BUTTON
#define DEFAULT_BUTTON_RELIEF  GTK_RELIEF_NONE

#define TOOL_BUTTON_DATA_KEY   "tz-tool-palette-item"
#define TOOL_INFO_DATA_KEY     "tz-tool-info"


typedef struct _TzToolPalettePrivate TzToolPalettePrivate;

struct _TzToolPalettePrivate
{
  gint         tool_rows;
  gint         tool_columns;
};

#define GET_PRIVATE(p) G_TYPE_INSTANCE_GET_PRIVATE (p, \
                                                    TZ_TYPE_TOOL_PALETTE, \
                                                    TzToolPalettePrivate)


static void     tz_tool_palette_size_allocate       (GtkWidget       *widget,
                                                       GtkAllocation   *allocation);


G_DEFINE_TYPE (TzToolPalette, tz_tool_palette, GTK_TYPE_TOOL_PALETTE)

#define parent_class tz_tool_palette_parent_class


static void
tz_tool_palette_class_init (TzToolPaletteClass *klass)
{
  GtkWidgetClass *widget_class = GTK_WIDGET_CLASS (klass);

  widget_class->size_allocate         = tz_tool_palette_size_allocate;

  g_type_class_add_private (klass, sizeof (TzToolPalettePrivate));
}

static void
tz_tool_palette_init (TzToolPalette *palette)
{
}

static void
tz_tool_palette_size_allocate (GtkWidget     *widget,
                               GtkAllocation *allocation)
{
  TzToolPalettePrivate *private = GET_PRIVATE (widget);
  GList                *children;
  GtkToolItemGroup     *group;

  GTK_WIDGET_CLASS (parent_class)->size_allocate (widget, allocation);

  children = gtk_container_get_children (GTK_CONTAINER (widget));
  g_return_if_fail (children);
  group = GTK_TOOL_ITEM_GROUP (children->data);
  g_list_free (children);

  guint tool_count = gtk_tool_item_group_get_n_items (group);
  if (tool_count > 0)
    {
      GtkWidget      *tool_button;
      GtkRequisition  button_requisition;
      gint            tool_rows;
      gint            tool_columns;

      tool_button = GTK_WIDGET (gtk_tool_item_group_get_nth_item (group, 0));
      gtk_widget_size_request (tool_button, &button_requisition);

      tool_columns = MAX (1, (allocation->width / button_requisition.width));
      tool_rows    = tool_count / tool_columns;

      if (tool_count % tool_columns)
        tool_rows++;

      if (private->tool_rows    != tool_rows  ||
          private->tool_columns != tool_columns)
        {
          private->tool_rows    = tool_rows;
          private->tool_columns = tool_columns;

          gtk_widget_set_size_request (widget, -1,
                                       tool_rows * button_requisition.height);
        }
    }
}

GtkWidget *
tz_tool_palette_new (void)
{
  return g_object_new (TZ_TYPE_TOOL_PALETTE, NULL);
}

// vim:ft=objc:ts=8:et:sts=2:sw=2:foldmethod=marker
