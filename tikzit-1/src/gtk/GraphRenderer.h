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

// classes
#import "Graph.h"
#import "Grid.h"
#import "PickSupport.h"
#import "TikzDocument.h"

// protocols
#import "Surface.h"

@interface GraphRenderer: NSObject <RenderDelegate> {
    TikzDocument       *doc;
    NSObject<Surface>  *surface;
    Grid               *grid;
    NSMutableSet       *highlightedNodes;
    id<RenderDelegate>  postRenderer;
}

@property (retain) id<RenderDelegate> postRenderer;

- (id) initWithSurface:(NSObject <Surface> *)surface;
- (id) initWithSurface:(NSObject <Surface> *)surface document:(TikzDocument*)document;
- (void) renderWithContext:(id<RenderContext>)context;
- (void) invalidateRect:(NSRect)rect;
- (void) invalidateGraph;
- (void) invalidateNode:(Node*)node;
- (void) invalidateEdge:(Edge*)edge;
- (void) invalidateNodesHitBy:(NSPoint)point;
- (BOOL) point:(NSPoint)p hitsNode:(Node*)node;
- (BOOL) point:(NSPoint)p hitsEdge:(Edge*)edge withFuzz:(float)fuzz;
/**
 * Finds a node at the given screen location.
 *
 * If there is more than one node at this point (because they overlap),
 * an arbitrary one is returned.
 */
- (Node*) anyNodeAt:(NSPoint)p;
/**
 * Finds an edge at the given screen location.
 *
 * If there is more than one edge at this point (because they overlap),
 * an arbitrary one is returned.
 *
 * @param fuzz   the fuzz for detecting edges: this will pick up
 *               edges that are close to the point
 */
- (Edge*) anyEdgeAt:(NSPoint)p withFuzz:(float)fuzz;

- (id<Surface>) surface;
- (Transformer*) transformer;
- (Grid*) grid;
- (PickSupport*) pickSupport;

- (Graph*) graph;

- (TikzDocument*) document;
- (void) setDocument:(TikzDocument*)document;

- (BOOL) isNodeHighlighted:(Node*)node;
- (void) setNode:(Node*)node highlighted:(BOOL)h;
- (void) clearHighlightedNodes;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
