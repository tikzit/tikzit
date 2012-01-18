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
#import "Configuration.h"
#import "TikzDocument.h"

@class PropertyListEditor;
@class GraphPropertyDelegate;
@class NodePropertyDelegate;
@class EdgePropertyDelegate;
@class EdgeNodePropertyDelegate;

@interface PropertyPane: NSObject {
    TikzDocument       *document;
    BOOL                blockUpdates;

    PropertyListEditor *graphProps;
    PropertyListEditor *nodeProps;
    PropertyListEditor *edgeProps;
    PropertyListEditor *edgeNodeProps;

    GraphPropertyDelegate *graphPropDelegate;
    NodePropertyDelegate *nodePropDelegate;
    EdgePropertyDelegate *edgePropDelegate;
    EdgeNodePropertyDelegate *edgeNodePropDelegate;

    GtkWidget       *propertiesPane;

    GtkExpander     *graphPropsExpander;
    GtkExpander     *nodePropsExpander;
    GtkExpander     *edgePropsExpander;

    GtkEntry        *nodeLabelEntry;
    GtkToggleButton *edgeNodeToggle;
    GtkWidget       *edgeNodePropsWidget;
    GtkEntry        *edgeNodeLabelEntry;
}

@property (readonly) GtkWidget    *widget;
@property (retain)   TikzDocument *document;

- (id) init;

- (void) restoreUiStateFromConfig:(Configuration*)file group:(NSString*)group;
- (void) saveUiStateToConfig:(Configuration*)file group:(NSString*)group;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
