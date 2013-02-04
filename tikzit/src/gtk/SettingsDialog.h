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

#import "TZFoundation.h"
#import <gtk/gtk.h>

@class Configuration;
@class EdgeStylesPalette;
@class NodeStylesPalette;
@class StyleManager;

@interface SettingsDialog: NSObject {
    Configuration     *configuration;
    StyleManager      *styleManager;
    NodeStylesPalette *nodePalette;
    EdgeStylesPalette *edgePalette;

    GtkWindow     *parentWindow;
    GtkWindow     *window;

    // we don't keep any refs, as we control
    // the top window
    GtkEntry      *pdflatexPathEntry;
}

@property (retain) Configuration *configuration;
@property (retain) StyleManager  *styleManager;
@property (assign) GtkWindow     *parentWindow;
@property (assign,getter=isVisible) BOOL visible;

- (id) initWithConfiguration:(Configuration*)c andStyleManager:(StyleManager*)m;

- (void) present;
- (void) show;
- (void) hide;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
