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

#import "TZFoundation.h"
#import <gtk/gtk.h>
#import "StyleManager.h"

@interface NodeStyleSelector: NSObject {
    GtkListStore        *store;
    GtkIconView         *view;
    StyleManager        *styleManager;
    BOOL                 linkedToActiveStyle;
    BOOL                 suppressSetActiveStyle;
}

/*!
 @property   widget
 @brief      The GTK widget
 */
@property (readonly) GtkWidget     *widget;

/*!
 @property   manager
 @brief      The StyleManager to use.  Default is [StyleManager manager]
 */
@property (retain)   StyleManager  *styleManager;

/*!
 @property   linkedToActiveStyles
 @brief      Whether the current selection should be the same as the
             style manager's active style
 */
@property (getter=isLinkedToActiveStyle) BOOL linkedToActiveStyle;

/*!
 @property   selectedStyle
 @brief      The selected style.  If linkedToActiveStyle is YES, this
             will be the same as [manager activeStyle].

             When this changes, a SelectedStyleChanged notification will be posted
 */
@property (assign) NodeStyle *selectedStyle;

/*!
 * Initialise with the default style manager
 */
- (id) init;
/*!
 * Initialise with the given style manager
 */
- (id) initWithStyleManager:(StyleManager*)m;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
