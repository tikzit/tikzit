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

@class EdgeStyle;
@class EdgeStylesModel;
@class StyleManager;

@interface EdgeStyleSelector: NSObject {
    EdgeStylesModel     *model;
    GtkTreeView         *view;
}

/*!
 @property   widget
 @brief      The GTK widget
 */
@property (readonly) GtkWidget       *widget;

/*!
 @property   model
 @brief      The model to use.
 */
@property (retain)   EdgeStylesModel *model;

/*!
 @property   selectedStyle
 @brief      The selected style.

             When this changes, a SelectedStyleChanged notification will be posted
 */
@property (assign)   EdgeStyle       *selectedStyle;

/*!
 * Initialise with a new model for the given style manager
 */
- (id) initWithStyleManager:(StyleManager*)m;
/*!
 * Initialise with the given model
 */
- (id) initWithModel:(EdgeStylesModel*)model;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
