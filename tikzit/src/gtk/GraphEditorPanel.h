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
#import <gtk/gtk.h>

@class GraphInputHandler;
@class GraphRenderer;
@class TikzDocument;
@class WidgetSurface;

@interface GraphEditorPanel : NSObject {
    GraphRenderer     *renderer;
    WidgetSurface     *surface;
    GraphInputHandler *inputHandler;
    id<Tool>           tool;
}
@property (retain)   TikzDocument      *document;
@property (readonly) GtkWidget         *widget;
@property (retain)   id<Tool>           activeTool;

- (id) init;
- (id) initWithDocument:(TikzDocument*)document;
- (void) grabTool;
- (void) zoomInAboutPoint:(NSPoint)pos;
- (void) zoomOutAboutPoint:(NSPoint)pos;
- (void) zoomIn;
- (void) zoomOut;
- (void) zoomReset;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
