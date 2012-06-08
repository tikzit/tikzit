/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
 * Copyright 2010  Chris Heunen
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

#import "GraphRenderer.h"
#import "Edge+Render.h"
#import "Node+Render.h"

static const float size = 5.0;

float sideHandleTop(NSRect bbox) {
    return (NSMinY(bbox) + NSMaxY(bbox) - size)/2.0f;
}

float tbHandleLeft(NSRect bbox) {
    return (NSMinX(bbox) + NSMaxX(bbox) - size)/2.0f;
}
void graph_renderer_expose_event(GtkWidget *widget, GdkEventExpose *event);

@interface GraphRenderer (Private)
- (BOOL) selectionBoxContainsNode:(Node*)node;
- (BOOL) halfEdgeIncludesNode:(Node*)node;
- (enum NodeState) nodeState:(Node*)node;
- (void) renderBoundingBoxWithContext:(id<RenderContext>)context;
- (void) renderSelectionBoxWithContext:(id<RenderContext>)context;
- (void) renderImpendingEdgeWithContext:(id<RenderContext>)context;
- (void) nodeNeedsRefreshing:(NSNotification*)notification;
- (void) edgeNeedsRefreshing:(NSNotification*)notification;
- (void) graphNeedsRefreshing:(NSNotification*)notification;
- (void) graphChanged:(NSNotification*)notification;
- (void) nodeStylePropertyChanged:(NSNotification*)notification;
- (void) edgeStylePropertyChanged:(NSNotification*)notification;
@end

@implementation GraphRenderer

- (id) initWithSurface:(NSObject <Surface> *)s {
    self = [super init];

    if (self) {
        surface = [s retain];
        doc = nil;
        grid = [[Grid alloc] initWithSpacing:1.0f subdivisions:4 transformer:[s transformer]];
        halfEdgeOrigin = nil;
        [surface setRenderDelegate:self];

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(nodeStylePropertyChanged:)
                                                     name:@"NodeStylePropertyChanged"
                                                   object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(edgeStylePropertyChanged:)
                                                     name:@"EdgeStylePropertyChanged"
                                                   object:nil];
    }

    return self;
}

- (id) initWithSurface:(NSObject <Surface> *)s document:(TikzDocument*)document {
    self = [self initWithSurface:s];

    if (self) {
        [self setDocument:document];
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [doc release];
    [grid release];
    [surface release];

    [super dealloc];
}

- (void) renderWithContext:(id<RenderContext>)context onSurface:(id<Surface>)surface {
    [self renderWithContext:context];
}

- (void) renderWithContext:(id<RenderContext>)context {
    // blank surface
    [context paintWithColor:WhiteRColor];

    // draw grid
    [grid renderGridInContext:context];

    // draw edges
    NSEnumerator *enumerator = [doc edgeEnumerator];
    Edge *edge;
    while ((edge = [enumerator nextObject]) != nil) {
        [edge renderToSurface:surface withContext:context selected:[doc isEdgeSelected:edge]];
    }

    // draw nodes
    enumerator = [doc nodeEnumerator];
    Node *node;
    while ((node = [enumerator nextObject]) != nil) {
        [node renderToSurface:surface withContext:context state:[self nodeState:node]];
    }

    [self renderBoundingBoxWithContext:context];
    [self renderSelectionBoxWithContext:context];
    [self renderImpendingEdgeWithContext:context];
}

- (void) invalidateGraph {
    [surface invalidate];
}

- (void) invalidateNodes:(NSSet*)nodes {
    for (Node *node in nodes) {
        [self invalidateNode:node];
    }
}

- (void) invalidateEdges:(NSSet*)edges {
    for (Edge *edge in edges) {
        [self invalidateEdge:edge];
    }
}

- (void) invalidateNode:(Node*)node {
    if (node == nil) {
        return;
    }
    NSRect nodeRect = [node renderBoundsWithLabelForSurface:surface];
    nodeRect = NSInsetRect (nodeRect, -2.0f, -2.0f);
    [surface invalidateRect:nodeRect];
}

- (void) invalidateEdge:(Edge*)edge {
    if (edge == nil) {
        return;
    }
    BOOL selected = [doc isEdgeSelected:edge];
    NSRect edgeRect = [edge renderedBoundsWithTransformer:[surface transformer] whenSelected:selected];
    edgeRect = NSInsetRect (edgeRect, -2.0f, -2.0f);
    [surface invalidateRect:edgeRect];
}

- (void) invalidateNodesHitBy:(NSPoint)point {
    NSEnumerator *enumerator = [doc nodeEnumerator];
    Node *node = nil;
    while ((node = [enumerator nextObject]) != nil) {
        if ([self point:point hitsNode:node]) {
            [self invalidateNode:node];
        }
    }
}

- (BOOL) point:(NSPoint)p hitsNode:(Node*)node {
    return [node hitByPoint:p onSurface:surface];
}

- (BOOL) point:(NSPoint)p fuzzyHitsNode:(Node*)node {
    NSRect bounds = [node renderBoundsForSurface:surface];
    return NSPointInRect(p, bounds);
}

- (BOOL) point:(NSPoint)p hitsEdge:(Edge*)edge withFuzz:(float)fuzz {
    return [edge hitByPoint:p onSurface:surface withFuzz:fuzz];
}

- (Node*) anyNodeAt:(NSPoint)p {
    NSEnumerator *enumerator = [doc nodeEnumerator];
    Node *node;
    while ((node = [enumerator nextObject]) != nil) {
        if ([self point:p hitsNode:node]) {
            return node;
        }
    }
    return nil;
}

- (Edge*) anyEdgeAt:(NSPoint)p withFuzz:(float)fuzz {
    // FIXME: is there an efficient way to find the "nearest" edge
    //        if the fuzz is the reason we hit more than one?
    NSEnumerator *enumerator = [doc edgeEnumerator];
    Edge *edge;
    while ((edge = [enumerator nextObject]) != nil) {
        if ([self point:p hitsEdge:edge withFuzz:fuzz]) {
            return edge;
        }
    }
    return nil;
}

- (id<Surface>) surface {
    return surface;
}

- (Transformer*) transformer {
    return [surface transformer];
}

- (Grid*) grid {
    return grid;
}

- (PickSupport*) pickSupport {
    return [doc pickSupport];
}

- (Graph*) graph {
    return [doc graph];
}

- (TikzDocument*) document {
    return doc;
}

- (void) setDocument:(TikzDocument*)document {
    if (doc == document) {
        return;
    }

    if (doc != nil) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:doc];
        [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:[doc pickSupport]];
    }

    [document retain];
    [doc release];
    doc = document;

    if (doc != nil) {
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphNeedsRefreshing:)
                name:@"GraphReplaced" object:doc];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphChanged:)
                name:@"GraphChanged" object:doc];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphChanged:)
                name:@"GraphBeingChanged" object:doc];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphChanged:)
                name:@"GraphChangeCancelled" object:doc];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(nodeNeedsRefreshing:)
                name:@"NodeSelected" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(nodeNeedsRefreshing:)
                name:@"NodeDeselected" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphNeedsRefreshing:)
                name:@"NodeSelectionReplaced" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(edgeNeedsRefreshing:)
                name:@"EdgeSelected" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(edgeNeedsRefreshing:)
                name:@"EdgeDeselected" object:[doc pickSupport]];
        [[NSNotificationCenter defaultCenter]
                addObserver:self
                selector:@selector(graphNeedsRefreshing:)
                name:@"EdgeSelectionReplaced" object:[doc pickSupport]];
    }
    [surface invalidate];
}

- (NSRect) selectionBox {
    return selectionBox;
}

- (void) setSelectionBox:(NSRect)box {
    NSRect invRect = NSUnionRect (selectionBox, box);
    selectionBox = box;
    [surface invalidateRect:NSInsetRect (invRect, -2, -2)];
}

- (void) clearSelectionBox {
    NSRect oldRect = selectionBox;

    NSRect emptyRect;
    selectionBox = emptyRect;

    [surface invalidateRect:NSInsetRect (oldRect, -2, -2)];
}

- (void) invalidateHalfEdge {
    if (halfEdgeOrigin != nil) {
        NSRect invRect = NSRectAroundPoints(halfEdgeEnd, halfEdgeOriginPoint);
        invRect = NSUnionRect(invRect, [halfEdgeOrigin renderBoundsWithLabelForSurface:surface]);

        NSEnumerator *enumerator = [doc nodeEnumerator];
        Node *node;
        while ((node = [enumerator nextObject]) != nil) {
            if ([self point:halfEdgeEnd fuzzyHitsNode:node]) {
                invRect = NSUnionRect(invRect, [node renderBoundsWithLabelForSurface:surface]);
            }
        }
        [surface invalidateRect:NSInsetRect (invRect, -2.0f, -2.0f)];
    }
}

- (void) setHalfEdgeFrom:(Node*)origin to:(NSPoint)end {
    [self invalidateHalfEdge];

    if (halfEdgeOrigin != origin) {
        [self invalidateNode:halfEdgeOrigin];
        halfEdgeOrigin = origin;
        halfEdgeOriginPoint = [[surface transformer] toScreen:[origin point]];
        [self invalidateNode:origin];
    }

    if (origin != nil) {
        halfEdgeEnd = end;
        [self invalidateHalfEdge];
    }
}

- (void) clearHalfEdge {
    [self invalidateHalfEdge];
    halfEdgeOrigin = nil;
}

- (BOOL) boundingBoxHandlesShown {
    return showBoundingBoxHandles;
}

- (void) setBoundingBoxHandlesShown:(BOOL)shown {
    if (showBoundingBoxHandles != shown) {
        showBoundingBoxHandles = shown;
        [self invalidateGraph];
    }
}

- (ResizeHandle) boundingBoxResizeHandleAt:(NSPoint)p {
    NSRect bbox = [[surface transformer] rectToScreen:[[self graph] boundingBox]];
    if (p.x >= NSMaxX(bbox)) {
        if (p.x <= NSMaxX(bbox) + size) {
            if (p.y >= NSMaxY(bbox)) {
                if (p.y <= NSMaxY(bbox) + size) {
                    return SouthEastHandle;
                }
            } else if (p.y <= NSMinY(bbox)) {
                if (p.y >= NSMinY(bbox) - size) {
                    return NorthEastHandle;
                }
            } else {
                float eastHandleTop = sideHandleTop(bbox);
                if (p.y >= eastHandleTop && p.y <= (eastHandleTop + size)) {
                    return EastHandle;
                }
            }
        }
    } else if (p.x <= NSMinX(bbox)) {
        if (p.x >= NSMinX(bbox) - size) {
            if (p.y >= NSMaxY(bbox)) {
                if (p.y <= NSMaxY(bbox) + size) {
                    return SouthWestHandle;
                }
            } else if (p.y <= NSMinY(bbox)) {
                if (p.y >= NSMinY(bbox) - size) {
                    return NorthWestHandle;
                }
            } else {
                float westHandleTop = sideHandleTop(bbox);
                if (p.y >= westHandleTop && p.y <= (westHandleTop + size)) {
                    return WestHandle;
                }
            }
        }
    } else if (p.y >= NSMaxY(bbox)) {
        if (p.y <= NSMaxY(bbox) + size) {
            float southHandleLeft = tbHandleLeft(bbox);
            if (p.x >= southHandleLeft && p.x <= (southHandleLeft + size)) {
                return SouthHandle;
            }
        }
    } else if (p.y <= NSMinY(bbox)) {
        if (p.y >= NSMinY(bbox) - size) {
            float northHandleLeft = tbHandleLeft(bbox);
            if (p.x >= northHandleLeft && p.x <= (northHandleLeft + size)) {
                return NorthHandle;
            }
        }
    }
    return NoHandle;
}

- (NSRect) boundingBoxResizeHandleRect:(ResizeHandle)handle {
    if (![[self graph] hasBoundingBox]) {
        return NSZeroRect;
    }
    NSRect bbox = [[surface transformer] rectToScreen:[[self graph] boundingBox]];
    switch (handle) {
        case EastHandle:
            return NSMakeRect(NSMaxX(bbox), sideHandleTop(bbox), size, size);
        case SouthEastHandle:
            return NSMakeRect(NSMaxX(bbox), NSMaxY(bbox), size, size);
        case SouthHandle:
            return NSMakeRect(tbHandleLeft(bbox), NSMaxY(bbox), size, size);
        case SouthWestHandle:
            return NSMakeRect(NSMaxX(bbox), NSMinY(bbox) - size, size, size);
        case WestHandle:
            return NSMakeRect(NSMinX(bbox) - size, sideHandleTop(bbox), size, size);
        case NorthWestHandle:
            return NSMakeRect(NSMinX(bbox) - size, NSMinY(bbox) - size, size, size);
        case NorthHandle:
            return NSMakeRect(tbHandleLeft(bbox), NSMinY(bbox) - size, size, size);
        case NorthEastHandle:
            return NSMakeRect(NSMinX(bbox) - size, NSMaxY(bbox), size, size);
        default:
            return NSZeroRect;
    }
}

@end

@implementation GraphRenderer (Private)
- (BOOL) selectionBoxContainsNode:(Node*)node {
    return !NSIsEmptyRect (selectionBox)
           && NSPointInRect([[surface transformer] toScreen:[node point]], selectionBox);
}
- (BOOL) halfEdgeIncludesNode:(Node*)node {
    if (halfEdgeOrigin == nil) {
        return FALSE;
    }
    return halfEdgeOrigin == node || [self point:halfEdgeEnd hitsNode:node];
}
- (enum NodeState) nodeState:(Node*)node {
    if ([doc isNodeSelected:node]) {
        return NodeSelected;
    } else if ([self selectionBoxContainsNode:node] || [self halfEdgeIncludesNode:node]) {
        return NodeHighlighted;
    } else {
        return NodeNormal;
    }
}

- (void) renderBoundingBoxWithContext:(id<RenderContext>)context {
    if ([[self graph] hasBoundingBox]) {
        [context saveState];

        NSRect bbox = [[surface transformer] rectToScreen:[[self graph] boundingBox]];

        [context setAntialiasMode:AntialiasDisabled];
        [context setLineWidth:1.0];
        [context startPath];
        [context rect:bbox];
        [context strokePathWithColor:MakeSolidRColor (1.0, 0.7, 0.5)];

        if ([self boundingBoxHandlesShown]) {
            [context startPath];
            [context rect:[self boundingBoxResizeHandleRect:EastHandle]];
            [context rect:[self boundingBoxResizeHandleRect:SouthEastHandle]];
            [context rect:[self boundingBoxResizeHandleRect:SouthHandle]];
            [context rect:[self boundingBoxResizeHandleRect:SouthWestHandle]];
            [context rect:[self boundingBoxResizeHandleRect:WestHandle]];
            [context rect:[self boundingBoxResizeHandleRect:NorthWestHandle]];
            [context rect:[self boundingBoxResizeHandleRect:NorthHandle]];
            [context rect:[self boundingBoxResizeHandleRect:NorthEastHandle]];
            [context strokePathWithColor:MakeSolidRColor (0.5, 0.5, 0.5)];
        }

        [context restoreState];
    }
}

- (void) renderSelectionBoxWithContext:(id<RenderContext>)context {
    if (!NSIsEmptyRect (selectionBox)) {
        [context saveState];

        [context setAntialiasMode:AntialiasDisabled];
        [context setLineWidth:1.0];
        [context startPath];
        [context rect:selectionBox];
        RColor fColor = MakeRColor (0.8, 0.8, 0.8, 0.2);
        RColor sColor = MakeSolidRColor (0.6, 0.6, 0.6);
        [context strokePathWithColor:sColor andFillWithColor:fColor];

        [context restoreState];
    }
}

- (void) renderImpendingEdgeWithContext:(id<RenderContext>)context {
    if (halfEdgeOrigin == nil) {
        return;
    }
    [context saveState];

    [context setLineWidth:1.0];
    [context startPath];
    [context moveTo:halfEdgeOriginPoint];
    [context lineTo:halfEdgeEnd];
    [context strokePathWithColor:MakeRColor (0, 0, 0, 0.5)];

    [context restoreState];
}

- (void) nodeNeedsRefreshing:(NSNotification*)notification {
    [self invalidateNode:[[notification userInfo] objectForKey:@"node"]];
}

- (void) edgeNeedsRefreshing:(NSNotification*)notification {
    Edge *edge = [[notification userInfo] objectForKey:@"edge"];
    NSRect edgeRect = [edge renderedBoundsWithTransformer:[surface transformer] whenSelected:YES];
    edgeRect = NSInsetRect (edgeRect, -2, -2);
    [surface invalidateRect:edgeRect];
}

- (void) graphNeedsRefreshing:(NSNotification*)notification {
    [self invalidateGraph];
}

- (void) graphChanged:(NSNotification*)notification {
    GraphChange *change = [[notification userInfo] objectForKey:@"change"];
    switch ([change changeType]) {
        case GraphAddition:
        case GraphDeletion:
            [self invalidateNodes:[change affectedNodes]];
            [self invalidateEdges:[change affectedEdges]];
            break;
        case NodePropertyChange:
            if (!NSEqualPoints ([[change oldNode] point], [[change nwNode] point])) {
                // if the node has moved, it may be affecting edges
                [surface invalidate];
            } else {
                // invalide both old and new (old node may be larger)
                [self invalidateNode:[change oldNode]];
                [self invalidateNode:[change nwNode]];
            }
            break;
        case EdgePropertyChange:
            // invalide both old and new (old bend may increase bounds)
            [self invalidateEdge:[change oldEdge]];
            [self invalidateEdge:[change nwEdge]];
            [self invalidateEdge:[change edgeRef]];
            break;
        case NodesPropertyChange:
            {
                NSEnumerator *enumerator = [[change oldNodeTable] keyEnumerator];
                Node *node = nil;
                while ((node = [enumerator nextObject]) != nil) {
                    NSPoint oldPos = [[[change oldNodeTable] objectForKey:node] point];
                    NSPoint newPos = [[[change nwNodeTable] objectForKey:node] point];
                    if (NSEqualPoints (oldPos, newPos)) {
                        [self invalidateNode:[[change oldNodeTable] objectForKey:node]];
                        [self invalidateNode:[[change nwNodeTable] objectForKey:node]];
                    } else {
                        [surface invalidate];
                        break;
                    }
                }
            }
            break;
        case NodesShift:
        case NodesFlip:
        case BoundingBoxChange:
            [surface invalidate];
            break;
        default:
            // unknown change
            [surface invalidate];
            break;
    };
}

- (void) nodeStylePropertyChanged:(NSNotification*)notification {
    if (![@"name" isEqual:[[notification userInfo] objectForKey:@"propertyName"]]) {
        BOOL affected = NO;
        for (Node *node in [[self graph] nodes]) {
            if ([node style] == [notification object])
                affected = YES;
        }
        if (affected)
            [surface invalidate];
    }
}

- (void) edgeStylePropertyChanged:(NSNotification*)notification {
    if (![@"name" isEqual:[[notification userInfo] objectForKey:@"propertyName"]]) {
        BOOL affected = NO;
        for (Edge *edge in [[self graph] edges]) {
            if ([edge style] == [notification object])
                affected = YES;
        }
        if (affected)
            [surface invalidate];
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
