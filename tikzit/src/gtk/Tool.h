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

#import "TZFoundation.h"
#import "InputDelegate.h"
#import "Surface.h"

#import <gtk/gtk.h>
#import <gdk-pixbuf/gdk-pixdata.h>

@class Configuration;
@class GraphRenderer;
@protocol InputDelegate;
@protocol RenderDelegate;

@protocol Tool <RenderDelegate,InputDelegate>
@property (readonly) NSString           *name;
@property (readonly) const gchar        *stockIcon;
@property (readonly) NSString           *helpText;
@property (readonly) NSString           *shortcut;
@property (retain)   GraphRenderer      *activeRenderer;
@property (readonly) GtkWidget          *configurationWidget;
- (void) loadConfiguration:(Configuration*)config;
- (void) saveConfiguration:(Configuration*)config;
+ (id) tool;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
