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
@class EdgeNodePropertyDelegate;
@class EdgePropertyDelegate;
@class EdgeStylesModel;
@class GraphPropertyDelegate;
@class NodePropertyDelegate;
@class NodeStylesModel;
@class PropertyListEditor;
@class StyleManager;
@class TikzDocument;

@interface PropertiesPane: NSObject {
    TikzDocument       *document;
    BOOL                blockUpdates;

    PropertyListEditor *graphProps;
    PropertyListEditor *nodeProps;
    PropertyListEditor *edgeProps;
    PropertyListEditor *edgeNodeProps;

    GraphPropertyDelegate    *graphPropDelegate;
    NodePropertyDelegate     *nodePropDelegate;
    EdgePropertyDelegate     *edgePropDelegate;
    EdgeNodePropertyDelegate *edgeNodePropDelegate;

    GtkWidget       *layout;

    GtkWidget       *currentPropsWidget; // no ref!

    GtkWidget       *graphPropsWidget;
    GtkWidget       *nodePropsWidget;
    GtkWidget       *edgePropsWidget;

    GtkEntry        *nodeLabelEntry;
    GtkToggleButton *edgeNodeToggle;
    GtkWidget       *edgeNodePropsWidget;
    GtkEntry        *edgeNodeLabelEntry;
}

@property (retain)   TikzDocument *document;
@property (assign)   BOOL          visible;
@property (readonly) GtkWidget    *gtkWidget;

- (id) initWithStyleManager:(StyleManager*)mgr;
- (id) initWithNodeStylesModel:(NodeStylesModel*)nsm
            andEdgeStylesModel:(EdgeStylesModel*)esm;

- (void) loadConfiguration:(Configuration*)config;
- (void) saveConfiguration:(Configuration*)config;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
