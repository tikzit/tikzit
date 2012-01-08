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

#include <gdk-pixbuf/gdk-pixbuf.h>

typedef enum {
  LOGO_SIZE_16,
  LOGO_SIZE_24,
  //LOGO_SIZE_32,
  LOGO_SIZE_48,
  LOGO_SIZE_64,
  LOGO_SIZE_128,
  LOGO_SIZE_COUNT
} LogoSize;

GdkPixbuf *get_logo (LogoSize size);

// vim:ft=objc:ts=8:et:sts=4:sw=4
