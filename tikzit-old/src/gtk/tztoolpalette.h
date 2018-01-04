/* GIMP - The GNU Image Manipulation Program
 * Copyright (C) 1995 Spencer Kimball and Peter Mattis
 *
 * tztoolpalette.h, based on gimptoolpalette.h
 * Copyright (C) 2010 Michael Natterer <mitch@gimp.org>
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

#ifndef __TZ_TOOL_PALETTE_H__
#define __TZ_TOOL_PALETTE_H__


#define TZ_TYPE_TOOL_PALETTE            (tz_tool_palette_get_type ())
#define TZ_TOOL_PALETTE(obj)            (G_TYPE_CHECK_INSTANCE_CAST ((obj), TZ_TYPE_TOOL_PALETTE, TzToolPalette))
#define TZ_TOOL_PALETTE_CLASS(klass)    (G_TYPE_CHECK_CLASS_CAST ((klass), TZ_TYPE_TOOL_PALETTE, TzToolPaletteClass))
#define TZ_IS_TOOL_PALETTE(obj)         (G_TYPE_CHECK_INSTANCE_TYPE ((obj), TZ_TYPE_TOOL_PALETTE))
#define TZ_IS_TOOL_PALETTE_CLASS(klass) (G_TYPE_CHECK_CLASS_TYPE ((klass), TZ_TYPE_TOOL_PALETTE))
#define TZ_TOOL_PALETTE_GET_CLASS(obj)  (G_TYPE_INSTANCE_GET_CLASS ((obj), TZ_TYPE_TOOL_PALETTE, TzToolPaletteClass))


typedef struct _TzToolPaletteClass TzToolPaletteClass;
typedef struct _TzToolPalette      TzToolPalette;

struct _TzToolPalette
{
  GtkToolPalette  parent_instance;
};

struct _TzToolPaletteClass
{
  GtkToolPaletteClass  parent_class;
};


GType       tz_tool_palette_get_type        (void) G_GNUC_CONST;

GtkWidget * tz_tool_palette_new             (void);

gboolean    tz_tool_palette_get_button_size (TzToolPalette *widget,
                                             gint          *width,
                                             gint          *height);


#endif /* __TZ_TOOL_PALETTE_H__ */
