/*
 * Copyright 2011-2012  Alex Merry <dev@randomguy3.me.uk>
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
#import <gtk/gtk.h>

@class Configuration;
@class EdgeStylesModel;
@class NodeStylesModel;
@class PropertiesPane;
@class SelectionPane;
@class StyleManager;
@class TikzDocument;
@class Window;

@interface ContextWindow: NSObject {
    PropertiesPane  *propsPane;
    SelectionPane   *selPane;

    GtkWidget       *window;
    GtkWidget       *layout;
}

@property (retain)   TikzDocument *document;
@property (assign)   BOOL          visible;

- (id) initWithStyleManager:(StyleManager*)mgr;
- (id) initWithNodeStylesModel:(NodeStylesModel*)nsm
            andEdgeStylesModel:(EdgeStylesModel*)esm;

- (void) present;
- (void) setTransientFor:(Window*)parent;

- (void) loadConfiguration:(Configuration*)config;
- (void) saveConfiguration:(Configuration*)config;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
