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
#import "GraphElementData.h"
#import "GraphElementProperty.h"

@protocol PropertyChangeDelegate
@optional
- (BOOL)startEdit;
- (void)endEdit;
- (void)cancelEdit;
@end

@interface PropertyListEditor: NSObject {
    GtkListStore                     *list;
    GtkWidget                        *view;
    GraphElementData                 *data;
    GtkWidget                        *widget;
    NSObject<PropertyChangeDelegate> *delegate;
}

/*!
 @property   widget
 @brief      The widget displaying the editable list
 */
@property (readonly)   GtkWidget *widget;

/*!
 @property   data
 @brief      The GraphElementData that should be reflected in the list
 */
@property (retain)   GraphElementData *data;

/*!
 @property   delegate
 @brief      A delegate for dealing with property changes
 */
@property (retain)   NSObject<PropertyChangeDelegate> *delegate;

/*!
 * Reload the properties from the data store
 */
- (void) reloadProperties;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
