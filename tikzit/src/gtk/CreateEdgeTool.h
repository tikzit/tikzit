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
#import "Tool.h"

@class EdgeStyle;
@class EdgeStyleSelector;
@class Node;
@class StyleManager;

@interface CreateEdgeTool : NSObject <Tool> {
    GraphRenderer     *renderer;
    StyleManager      *styleManager;
    EdgeStyleSelector *stylePicker;
    Node              *sourceNode;
    NSPoint            sourceNodeScreenPoint;
    NSPoint            halfEdgeEnd;
}

@property (retain) StyleManager *styleManager;
@property (retain) EdgeStyle    *activeStyle;

+ (id) toolWithStyleManager:(StyleManager*)sm;
- (id) initWithStyleManager:(StyleManager*)sm;
@end


// vim:ft=objc:ts=8:et:sts=4:sw=4
