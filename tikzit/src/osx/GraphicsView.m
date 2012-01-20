//
//  GraphicsView.m
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  

#import "GraphicsView.h"
#import "util.h"
#import "CALayer+DrawLabel.h"

#import "NodeSelectionLayer.h"
#import "NodeLayer.h"
#import "EdgeControlLayer.h"
#import "AppDelegate.h"
#import "TikzGraphAssembler.h"
#import "TikzSourceController.h"

@interface GraphicsView (Private)
- (void)setupLayers;
- (void)addNodeLayers:(Node*)n;
- (void)addEdgeLayers:(Edge*)e;
- (void)removeNodeLayers:(Node*)n;
- (void)resetMainOrigin;
- (void)setMainOrigin:(NSPoint)o;
@end

static CGColorRef cgGrayColor, cgWhiteColor, cgClearColor = nil;


@implementation GraphicsView

@synthesize enabled, transformer, pickSupport, tikzSourceController;

- (void)postGraphChange {
	[[NSNotificationCenter defaultCenter] postNotificationName:@"GraphChanged"
														object:self];
	[self postSelectionChange];
}

- (void)postSelectionChange {
	[[NSNotificationCenter defaultCenter] postNotificationName:@"SelectionChanged"
														object:self];
}

- (id)initWithFrame:(NSRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        if (cgClearColor == nil) {
            cgClearColor = CGColorGetConstantColor(kCGColorClear);
            cgGrayColor = CGColorCreateGenericGray(0.5f, 0.5f);
            cgWhiteColor = CGColorCreateGenericRGB(1, 1, 1, 1);
        }
        
		transformer = [[Transformer alloc] init];
		mouseMode = SelectMode;
		grid = [Grid gridWithSpacing:1.0f
						subdivisions:4
						 transformer:transformer];
        [grid setSize:NSSizeFromCGSize([gridLayer bounds].size)];
		[transformer setScale:PIXELS_PER_UNIT];
		
		[self setupLayers];
		
		leaderNode = nil;
		pickSupport = [[PickSupport alloc] init];
		frameMoveMode = NO;
        
		enabled = YES;
		[self setGraph:[Graph graph]];
    }
    return self;
}

- (void)awakeFromNib {
	AppDelegate *del = [application delegate];
	stylePaletteController = [del stylePaletteController];
	toolPaletteController = [del toolPaletteController];
    [self refreshLayers];
    [self postGraphChange];
}

- (void)setupLayers {
	mainLayer = [CALayer layer];
	[mainLayer setBackgroundColor:cgWhiteColor];
	[mainLayer setFrame:CGRectIntegral(NSRectToCGRect([self bounds]))];
	[mainLayer setOpacity:1.0f];
	[self setLayer:mainLayer];
    [self resetMainOrigin];
	
	gridLayer = [CALayer layer];
	[gridLayer setDelegate:grid];
	[gridLayer setOpacity:0.3f];
	[mainLayer addSublayer:gridLayer];
	
	graphLayer = [CALayer layer];
	[graphLayer setDelegate:self];
	[mainLayer addSublayer:graphLayer];
	
	hudLayer = [CALayer layer];
	[mainLayer addSublayer:hudLayer];
	
	selectionLayer = [SelectBoxLayer layer];
	[mainLayer addSublayer:selectionLayer];
	
    [transformer setOrigin:NSMakePoint(NSMidX([self bounds]),NSMidY([self bounds]))];
    oldBounds = [self bounds];
	[self refreshLayers];
}

// Lion resume feature
//- (void)encodeRestorableStateWithCoder:(NSCoder*)coder {
//    NSLog(@"got encode request");
//}
//- (void)restoreStateWithCoder:(NSCoder*)coder {
//    NSLog(@"got decode request");
//}

- (void)registerUndo:(NSString*)oldTikz withActionName:(NSString*)nm {
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(undoGraphChange:)
										 object:oldTikz];
	[documentUndoManager setActionName:nm];
}

- (void)revertToTikz:(NSString*)tikz {
    [tikzSourceController setTikz:tikz];
    [tikzSourceController tryParseTikz];
    [self refreshLayers];
    [self postGraphChange];
}


- (void)undoGraphChange:(NSString*)oldTikz {
    NSString *currentTikz = [graph tikz];
    [self revertToTikz:oldTikz];
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(undoGraphChange:)
										 object:currentTikz];
}

- (void)setGraph:(Graph*)gr {
	graph = gr;
	
	NSEnumerator *e;
	CALayer *layer;
	
	e = [edgeControlLayers objectEnumerator];
	while (layer = [e nextObject]) [layer removeFromSuperlayer];
	edgeControlLayers = [NSMapTable mapTableWithStrongToStrongObjects];
	
	
	e = [nodeLayers objectEnumerator];
	while (layer = [e nextObject]) [layer removeFromSuperlayer];
	nodeLayers = [NSMapTable mapTableWithStrongToStrongObjects];
	
	for (Node *n in [graph nodes]) {
		[n attachStyleFromTable:[stylePaletteController nodeStyles]];
		[self addNodeLayers:n];
	}
	
	for (Edge *e in [graph edges]) {
		[e setAttributesFromData];
        [e attachStyleFromTable:[stylePaletteController edgeStyles]];
		[self addEdgeLayers:e];
	}
}

- (Graph*)graph { return graph; }

- (void)setMainOrigin:(NSPoint)o {
    o.x = round(o.x);
    o.y = round(o.y);
    CGRect rect = [mainLayer frame];
    rect.origin = NSPointToCGPoint(o);
    [mainLayer setFrame:rect];
}

- (void)resetMainOrigin {
    NSRect bds = [self bounds];
    bds.origin.x -= bds.size.width;
    bds.origin.y -= bds.size.height;
    bds.size.width *= 3;
    bds.size.height *= 3;
    [mainLayer setFrame:NSRectToCGRect([self bounds])];
}

- (void)refreshLayers {
	[gridLayer setFrame:[mainLayer frame]];
	[graphLayer setFrame:[mainLayer frame]];
	[hudLayer setFrame:[mainLayer frame]];
	[selectionLayer setFrame:[mainLayer frame]];
	
	if (enabled) {
		[hudLayer setBackgroundColor:cgClearColor];
	} else {
		[hudLayer setBackgroundColor:cgGrayColor];
	}
	
    [grid setSize:NSSizeFromCGSize([gridLayer bounds].size)];
	[gridLayer setNeedsDisplay];
	[graphLayer setNeedsDisplay];
	[hudLayer setNeedsDisplay];
	
	NSEnumerator *e = [edgeControlLayers objectEnumerator];
	CALayer *layer;
	while (layer = [e nextObject]) {
		[layer setFrame:[graphLayer frame]];
		[layer setNeedsDisplay];
	}
}


- (void)viewDidEndLiveResize {
	[super viewDidEndLiveResize];
    NSPoint o = [transformer origin];
    o.x += round(([self bounds].size.width - oldBounds.size.width)/2.0f);
    o.y += round(([self bounds].size.height - oldBounds.size.height)/2.0f);
    [transformer setOrigin:o];
    oldBounds = [self bounds];
	[self refreshLayers];
}

- (void)applyStyleToSelectedNodes:(NodeStyle*)style {
	NSString *oldTikz = [graph tikz];
    
	for (Node *n in [pickSupport selectedNodes]) {
		[n setStyle:style];
		[[nodeLayers objectForKey:n] setNeedsDisplay];
	}
	
    [self registerUndo:oldTikz withActionName:@"Apply Style to Nodes"];
	[self refreshLayers];
	[self postGraphChange];
}

- (void)applyStyleToSelectedEdges:(EdgeStyle*)style {
	NSString *oldTikz = [graph tikz];
    
	for (Edge *e in [pickSupport selectedEdges]) {
		[e setStyle:style];
	}
    
	[self registerUndo:oldTikz withActionName:@"Apply Style to Edges"];
	[self refreshLayers];
	[self postGraphChange];
}

- (void)addNodeLayers:(Node*)n {
	// add a node to the graph
	[graph addNode:n];
	
	NSPoint pt = [transformer toScreen:[n point]];
	
	// add a node layer
	NodeLayer *nl = [[NodeLayer alloc] initWithNode:n transformer:transformer];
	[nl setCenter:pt];
	[nodeLayers setObject:nl forKey:n];
	[graphLayer addSublayer:nl];
	[nl setNeedsDisplay];
}

- (void)removeNodeLayers:(Node*)n {
	[[nodeLayers objectForKey:n] removeFromSuperlayer];
	[nodeLayers removeObjectForKey:n];
}

- (void)addEdgeLayers:(Edge *)e {
	[graph addEdge:e];
	EdgeControlLayer *ecl = [[EdgeControlLayer alloc] initWithEdge:e andTransformer:transformer];
	[edgeControlLayers setObject:ecl forKey:e];
	[ecl setFrame:CGRectMake(10, 10, 100, 100)];
	[hudLayer addSublayer:ecl];
	[ecl setNeedsDisplay];
}

- (void)removeEdgeLayers:(Edge*)e {
	[[edgeControlLayers objectForKey:e] removeFromSuperlayer];
	[edgeControlLayers removeObjectForKey:e];
	[self refreshLayers];
}

- (BOOL)circleWithCenter:(NSPoint)center andRadius:(float)radius containsPoint:(NSPoint)p {
	float dx = center.x - p.x;
	float dy = center.y - p.y;
	return (dx*dx + dy*dy) <= radius*radius;
}

- (BOOL)node:(Node*)node containsPoint:(NSPoint)p {
	NodeLayer *nl = [nodeLayers objectForKey:node];
	return [nl nodeContainsPoint:p];
}

- (BOOL)edge:(Edge*)edge containsPoint:(NSPoint)p {
//	NSPoint center = [transformer toScreen:edge.mid];
//	float dx = center.x - p.x;
//	float dy = center.y - p.y;
//	float radius = 5.0f; // tolerence for clicks
//	return (dx*dx + dy*dy) <= radius*radius;
	
	CGContextRef ctx = (CGContextRef)[[NSGraphicsContext currentContext] graphicsPort];
	
    // Save the graphics state before doing the hit detection.
    CGContextSaveGState(ctx);
	
	NSPoint src = [transformer toScreen:[edge tail]];
	NSPoint targ = [transformer toScreen:[edge head]];
	NSPoint cp1 = [transformer toScreen:[edge cp1]];
	NSPoint cp2 = [transformer toScreen:[edge cp2]];
	
	CGContextSetLineWidth(ctx, 8.0f);
	
	CGContextMoveToPoint(ctx, src.x, src.y);
	CGContextAddCurveToPoint(ctx, cp1.x, cp1.y, cp2.x, cp2.y, targ.x, targ.y);
	
    BOOL containsPoint = CGContextPathContainsPoint(ctx, NSPointToCGPoint(p), kCGPathStroke);
	
	CGContextSetRGBStrokeColor(ctx, 0, 0, 0, 0);
	
	CGContextStrokePath(ctx);
	//CGContextFlush(ctx);
    CGContextRestoreGState(ctx);
	
	return containsPoint;
}

- (void)shiftNodes:(NSSet*)set from:(NSPoint)source to:(NSPoint)dest {
	float dx = dest.x - source.x;
	float dy = dest.y - source.y;
	
	for (Node *n in set) {
		NSPoint p = [transformer toScreen:[n point]];
		p = [grid snapScreenPoint:NSMakePoint(p.x+dx, p.y+dy)];
		[n setPoint:[transformer fromScreen:p]];
	}
}


- (void)mouseDown:(NSEvent*)theEvent {
	if (!enabled) return;
	
	[self updateMouseMode];
	
	dragOrigin = [self convertPoint:[theEvent locationInWindow] fromView:nil];
	dragTarget = dragOrigin;
    
    graphTikzOnMouseDown = [graph tikz];
    
    if ([theEvent modifierFlags] & NSCommandKeyMask) {
        oldTransformerOrigin = [transformer origin];
        oldMainOrigin = [self frame].origin;
        frameMoveMode = YES;
        return;
    }
    
	if (mouseMode == SelectMode) {
		[selectionLayer setActive:YES];
		[selectionLayer setSelectBox:NSRectAroundPoints(dragOrigin, dragOrigin)];
		[selectionLayer setNeedsDisplay];
		
		modifyEdge = nil;
		NSPoint cp1, cp2;
		for (Edge *e in [pickSupport selectedEdges]) {
			cp1 = [transformer toScreen:[e cp1]];
			cp2 = [transformer toScreen:[e cp2]];
			if ([self circleWithCenter:cp1
                             andRadius:[EdgeControlLayer handleRadius]
                         containsPoint:dragOrigin])
            {
				mouseMode = SelectEdgeBendMode;
				modifyEdge = e;
				firstControlPoint = YES;
				break;
			} else if ([self circleWithCenter:cp2
                                    andRadius:[EdgeControlLayer handleRadius]
                                containsPoint:dragOrigin])
            {
				mouseMode = SelectEdgeBendMode;
				modifyEdge = e;
				firstControlPoint = NO;
				break;
			}
		}
		
		if (modifyEdge == nil) { // skip all the rest if we're modifying an edge
		
			leaderNode = nil;
			
			// in first pass, try to find a leader node, under the mouse
			for (Node* n in [graph nodes]) {
				if ([self node:n containsPoint:dragOrigin]) {
					leaderNode = n;
					[gridLayer setOpacity:1.0f];
					break;
				}
			}
			
			// if we found one, deselect the others (if appropriate) and go to move mode
			if (leaderNode != nil) {
				startPoint = [leaderNode point];
				
				// if we select a node, we should always deselect all edges:
				for (Edge *e in [graph edges]) [[edgeControlLayers objectForKey:e] deselect];
				[pickSupport deselectAllEdges];
				
				BOOL shouldDeselect =
					!([theEvent modifierFlags] & NSShiftKeyMask)
					&& ![pickSupport isNodeSelected:leaderNode];
				for (Node *n in [graph nodes]) {
					if (n != leaderNode && shouldDeselect) {
						[pickSupport deselectNode:n];
						[[[nodeLayers objectForKey:n] selection] deselect];
					}
				}
				
				// ensure the leader node is actually selected
				if (![pickSupport isNodeSelected:leaderNode]) {
					[pickSupport selectNode:leaderNode];
					[[[nodeLayers objectForKey:leaderNode] selection] select];
				}
				
				
				// put us in move mode
				mouseMode = SelectMoveMode;
			} else {
				mouseMode = SelectBoxMode;
				
				// if we didn't select a node, start hunting for an edge to select
				BOOL shouldDeselect = !([theEvent modifierFlags] & NSShiftKeyMask);
				
				if (shouldDeselect) {
					[pickSupport deselectAllEdges];
					for (Edge *e in graph.edges) [[edgeControlLayers objectForKey:e] deselect];
				}
				
				for (Edge* e in [graph edges]) {
					// find the first node under the pointer, select it, show its controls
					//  and deselect all others if shift isn't down
					if ([self edge:e containsPoint:dragOrigin]) {
						for (Node *n in [pickSupport selectedNodes]) [[[nodeLayers objectForKey:n] selection] deselect];
						
						[pickSupport deselectAllNodes];
						[pickSupport selectEdge:e];
						[[edgeControlLayers objectForKey:e] select];
						break;
					}
				} // end for e in [graph edges]
			} // end if leaderNode == nil
		} // end if modifyEdge == nil
		
	} else if (mouseMode == NodeMode) {
		// do nothing...
	} else if (mouseMode == EdgeMode) {
		for (Node *n in [graph nodes]) {
			if ([self node:n containsPoint:dragOrigin]) {
				[[[nodeLayers objectForKey:n] selection] highlight];
			}
		}
		mouseMode = EdgeDragMode;
	} else if (mouseMode == CropMode) {
		if ([graph hasBoundingBox]) {
			float fudge = 3;
			
			NSRect bb = [graph boundingBox];
			NSPoint bl = [transformer toScreen:bb.origin];
			NSPoint tr = [transformer
						  toScreen:NSMakePoint(bb.origin.x+bb.size.width,
											   bb.origin.y+bb.size.height)];
			if (dragOrigin.x > bl.x-fudge && dragOrigin.x < tr.x+fudge &&
				dragOrigin.y > tr.y-fudge && dragOrigin.y < tr.y+fudge)
			{
				bboxBottomTop = 1;
			} else if (dragOrigin.x > bl.x-fudge && dragOrigin.x < tr.x+fudge &&
					   dragOrigin.y > bl.y-fudge && dragOrigin.y < bl.y+fudge)
			{
				bboxBottomTop = -1;
			} else {
				bboxBottomTop = 0;
			}
			
			if (dragOrigin.y > bl.y-fudge && dragOrigin.y < tr.y+fudge &&
				dragOrigin.x > tr.x-fudge && dragOrigin.x < tr.x+fudge)
			{
				bboxLeftRight = 1;
			} else if (dragOrigin.y > bl.y-fudge && dragOrigin.y < tr.y+fudge &&
					   dragOrigin.x > bl.x-fudge && dragOrigin.x < bl.x+fudge)
			{
				bboxLeftRight = -1;
			} else {
				bboxLeftRight = 0;
			}
			
			if (bboxBottomTop != 0 || bboxLeftRight != 0) {
				mouseMode = CropDragMode;
			}
		}
	} else {
		printf("WARNING: MOUSE DOWN IN INVALID MODE.\n");
	}
	
	[self refreshLayers];
}

- (void)mouseDragged:(NSEvent *)theEvent {
	if (!enabled) return;
	dragTarget = [self convertPoint:[theEvent locationInWindow] fromView:nil];
	
    if (frameMoveMode) {
        NSPoint newTransOrigin, newMainOrigin;
        NSPoint diff = NSMakePoint(dragTarget.x - dragOrigin.x, dragTarget.y - dragOrigin.y);
        newTransOrigin.x = oldTransformerOrigin.x + diff.x;
        newTransOrigin.y = oldTransformerOrigin.y + diff.y;
        newMainOrigin.x = oldMainOrigin.x + diff.x;
        newMainOrigin.y = oldMainOrigin.y + diff.y;
        
        [CATransaction begin];
        [CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
        [self setMainOrigin:newMainOrigin];
        [CATransaction commit];
        
        [transformer setOrigin:newTransOrigin];
        return;
    }
    
	if (mouseMode == SelectBoxMode) {
		[selectionLayer setSelectBox:NSRectAroundPoints(dragOrigin, dragTarget)];
		[selectionLayer setNeedsDisplay];
		
		for (Node* n in [graph nodes]) {
			if (NSPointInRect([transformer toScreen:[n point]], [selectionLayer selectBox])) {
				[[[nodeLayers objectForKey:n] selection] highlight];
			} else if (!([theEvent modifierFlags] & NSShiftKeyMask)) {
				[[[nodeLayers objectForKey:n] selection] unhighlight];
			}
		}
	} else if (mouseMode == SelectMoveMode) {
		if (leaderNode != nil) {
			[self shiftNodes:[pickSupport selectedNodes]
						from:[transformer toScreen:[leaderNode point]]
						  to:dragTarget];
		} else {
			printf("WARNING: LEADER NODE SHOULD NOT BE NIL.\n");
		}
		
		[self refreshLayers];
	} else if (mouseMode == SelectEdgeBendMode) {
		NSPoint src = [transformer toScreen:[[modifyEdge source] point]];
		NSPoint targ = [transformer toScreen:[[modifyEdge target] point]];
		float dx1 = targ.x - src.x;
		float dy1 = targ.y - src.y;
		float dx2, dy2;
		if (firstControlPoint) {
			dx2 = dragTarget.x - src.x;
			dy2 = dragTarget.y - src.y;
		} else {
			dx2 = dragTarget.x - targ.x;
			dy2 = dragTarget.y - targ.y;
		}
		float base_dist = sqrt(dx1*dx1 + dy1*dy1);
		float handle_dist = sqrt(dx2*dx2 + dy2*dy2);
		float wcourseness = 0.1f;
		
		if (![modifyEdge isSelfLoop]) {
			if (base_dist != 0) {
				[modifyEdge setWeight:roundToNearest(wcourseness, handle_dist/base_dist)];
				//round(handle_dist / (base_dist*wcourseness)) * wcourseness;
			} else {
				[modifyEdge setWeight:
				  roundToNearest(wcourseness, [transformer scaleFromScreen:handle_dist])];
			}
		}
		
		
		float control_angle = good_atan(dx2, dy2);
		
		int bcourseness = 15;
		
		if ([modifyEdge bendMode] == EdgeBendModeBasic) {
			float bnd;
			float base_angle = good_atan(dx1, dy1);
			if (firstControlPoint) {
				bnd = base_angle - control_angle;
			} else {
				bnd = control_angle - base_angle + pi;
				if (bnd > pi) bnd -= 2*pi;
			}
			
			[modifyEdge setBend:round(bnd * (180.0f / pi) *
                                (1.0f / (float)bcourseness)) *
                                bcourseness];
		} else {
			int bnd = round(control_angle * (180.0f / pi) *
							(1.0f / (float)bcourseness)) *
					  bcourseness;
			if (firstControlPoint) {
				if ([theEvent modifierFlags] & NSAlternateKeyMask) {
                    if ([modifyEdge isSelfLoop]) {
                        [modifyEdge setInAngle:[modifyEdge inAngle] +
                         (bnd - [modifyEdge outAngle])];
                    } else {
                        [modifyEdge setInAngle:[modifyEdge inAngle] -
                         (bnd - [modifyEdge outAngle])];
                    }
				}
				
				[modifyEdge setOutAngle:bnd];
			} else {
				if (theEvent.modifierFlags & NSAlternateKeyMask) {
                    if ([modifyEdge isSelfLoop]) {
                        [modifyEdge setOutAngle:[modifyEdge outAngle] +
                         (bnd - [modifyEdge inAngle])];
                    } else {
                        [modifyEdge setOutAngle:[modifyEdge outAngle] -
                         (bnd - [modifyEdge inAngle])];
                    }
				}
				
				[modifyEdge setInAngle:bnd];
			}
		}
		
		[self refreshLayers];
	} else if (mouseMode == NodeMode) {
		// do nothing...
	} else if (mouseMode == EdgeDragMode) {
		for (Node *n in [graph nodes]) {
			if ([self node:n containsPoint:dragOrigin] ||
				[self node:n containsPoint:dragTarget])
			{
				[[[nodeLayers objectForKey:n] selection] highlight];
			} else {
				[[[nodeLayers objectForKey:n] selection] unhighlight];
			}
		}
		
		[self refreshLayers];
	} else if (mouseMode == CropMode || mouseMode == CropDragMode) {
		NSPoint p1 = [transformer fromScreen:[grid snapScreenPoint:dragOrigin]];
		NSPoint p2 = [transformer fromScreen:[grid snapScreenPoint:dragTarget]];
		
		NSRect bbox;
		if (mouseMode == CropDragMode) {
			bbox = [graph boundingBox];
			if (bboxBottomTop == -1) {
				float dy = p2.y - bbox.origin.y;
				bbox.origin.y += dy;
				bbox.size.height -= dy;
			} else if (bboxBottomTop == 1) {
				float dy = p2.y - (bbox.origin.y + bbox.size.height);
				bbox.size.height += dy;
			}
			
			if (bboxLeftRight == -1) {
				float dx = p2.x - bbox.origin.x;
				bbox.origin.x += dx;
				bbox.size.width -= dx;
			} else if (bboxLeftRight == 1) {
				float dx = p2.x - (bbox.origin.x + bbox.size.width);
				bbox.size.width += dx;
			}
		} else {
			bbox = NSRectAroundPoints(p1, p2);
		}
		
		[graph setBoundingBox:bbox];
		[self postGraphChange];
		[self refreshLayers];
	} else {
		printf("WARNING: MOUSE DRAGGED IN INVALID MODE.\n");
	}
}

- (void)mouseUp:(NSEvent*)theEvent {
	if (!enabled) return;
    
    if (frameMoveMode) {
        [CATransaction begin];
        [CATransaction setValue:(id)kCFBooleanTrue forKey:kCATransactionDisableActions];
        [self resetMainOrigin];
        [self refreshLayers];
        [CATransaction commit];
        frameMoveMode = NO;
        return;
    }
    
	dragTarget = [self convertPoint:[theEvent locationInWindow] fromView:nil];
    
	if ((mouseMode & SelectMode) == SelectMode && [theEvent clickCount] == 2) {
		for (Edge *e in [graph edges]) {
			if ([self edge:e containsPoint:dragTarget]) {
				if ([e bendMode] == EdgeBendModeBasic) {
					[e convertBendToAngles];
					[e setBendMode:EdgeBendModeInOut];
				} else {
					[e convertAnglesToBend];
					[e setBendMode:EdgeBendModeBasic];
				}
				
                [self registerUndo:graphTikzOnMouseDown withActionName:@"Change Edge Mode"];
				[self postGraphChange];
				break;
			}
		}
	}
	
	if (mouseMode == SelectBoxMode) {
		for (Node* n in [graph nodes]) {
			if (NSPointInRect([transformer toScreen:[n point]], [selectionLayer selectBox])) {
				[pickSupport selectNode:n];
				[[[nodeLayers objectForKey:n] selection] select];
			} else if (!([theEvent modifierFlags] & NSShiftKeyMask)) {
				[pickSupport deselectNode:n];
				[[[nodeLayers objectForKey:n] selection] deselect];
			}
		}
		
		[selectionLayer setActive:NO];
		[selectionLayer setNeedsDisplay];
		[self postSelectionChange];
		
		mouseMode = SelectMode;
	} else if (mouseMode == SelectMoveMode) {
		[gridLayer setOpacity:0.3f];
		
		if (dragTarget.x != dragOrigin.x || dragTarget.y != dragOrigin.y) {
			[self registerUndo:graphTikzOnMouseDown withActionName:@"Shift Nodes"];
		}
		
		leaderNode = nil;
		
		[self postGraphChange];
		mouseMode = SelectMode;
	} else if (mouseMode == SelectEdgeBendMode) {
        [self registerUndo:graphTikzOnMouseDown withActionName:@"Adjust Edge"];
		[self postGraphChange];
		mouseMode = SelectMode;
		modifyEdge = nil;
	} else if (mouseMode == NodeMode) {
		NSPoint coords = [transformer fromScreen:[grid snapScreenPoint:dragTarget]];
		Node *n = [Node nodeWithPoint:coords];
		[n setStyle:[stylePaletteController activeNodeStyle]];
		[graph addNode:n];
		
		[self registerUndo:graphTikzOnMouseDown withActionName:@"Add Node"];
		
		[self addNodeLayers:n];
		[self postGraphChange];
	} else if (mouseMode == EdgeDragMode) {
		Node *src = nil;
		Node *targ = nil;
		BOOL found = NO; // don't break the loop until everything is unhighlighted
		for (Node *n in [graph nodes]) {
			[[[nodeLayers objectForKey:n] selection] unhighlight];
			if (!found) {
				if ([self node:n containsPoint:dragOrigin]) src = n;
				if ([self node:n containsPoint:dragTarget]) targ = n;
				if (src != nil && targ != nil) {
					Edge *e = [Edge edgeWithSource:src andTarget:targ];
                    [e setStyle:[stylePaletteController activeEdgeStyle]];
					[graph addEdge:e];
					[self registerUndo:graphTikzOnMouseDown withActionName:@"Add Edge"];
					[self addEdgeLayers:e];
					found = YES;
				}
			}
		}
		
		[self postGraphChange];
		mouseMode = EdgeMode;
	} else if (mouseMode == CropMode || mouseMode == CropDragMode) {
		if (dragOrigin.x == dragTarget.x && dragOrigin.y == dragTarget.y) {
			[graph setBoundingBox:NSMakeRect(0, 0, 0, 0)];
            [self registerUndo:graphTikzOnMouseDown withActionName:@"Clear Bounding Box"];
			[self postGraphChange];
		} else {
            [self registerUndo:graphTikzOnMouseDown withActionName:@"Change Bounding Box"];
        }
		
		mouseMode = CropMode;
	} else {
		if (! ([theEvent modifierFlags] & NSCommandKeyMask))
            printf("WARNING: MOUSE UP IN INVALID MODE.\n");
	}
	
	[self refreshLayers];
}

- (void)drawNode:(Node*)nd onLayer:(CALayer*)layer inContext:(CGContextRef)context {
	NSPoint pt = [transformer toScreen:[nd point]];
	
	NodeLayer *nl = [nodeLayers objectForKey:nd];
	//[nl setStrokeWidth:2.0f];
	[nl setCenter:pt andAnimateWhen:(mouseMode != SelectMoveMode)];
}

- (void)drawEdge:(Edge*)e onLayer:(CALayer*)layer inContext:(CGContextRef)context {
	CGContextSaveGState(context);
	NSPoint src = [transformer toScreen:[e tail]];
	NSPoint targ = [transformer toScreen:[e head]];
	NSPoint cp1 = [transformer toScreen:[e cp1]];
	NSPoint cp2 = [transformer toScreen:[e cp2]];
	
	// all nodes have the same radius. this will need to be fixed
	float sradius = 0;//(slayer.ghost) ? 0 : slayer.radius;
	float tradius = 0;//(tlayer.ghost) ? 0 : tlayer.radius;
	
	float sdx = cp1.x - src.x;
	float sdy = cp1.y - src.y;
	float sdist = sqrt(sdx*sdx + sdy*sdy);
	float sshortx = (sdist==0) ? 0 : sdx/sdist * sradius;
	float sshorty = (sdist==0) ? 0 : sdy/sdist * sradius;
	
	float tdx = cp2.x - targ.x;
	float tdy = cp2.y - targ.y;
	float tdist = sqrt(tdx*tdx + tdy*tdy);
	float tshortx = (tdist==0) ? 0 : tdx/sdist * tradius;
	float tshorty = (tdist==0) ? 0 : tdy/sdist * tradius;
	
	CGContextMoveToPoint(context, src.x+sshortx, src.y+sshorty);
	CGContextAddCurveToPoint(context, cp1.x, cp1.y, cp2.x, cp2.y, targ.x+tshortx, targ.y+tshorty);
	
    
    float lineWidth = [transformer scaleToScreen:0.04f];
	
	CGContextSetLineWidth(context, lineWidth);
	CGContextSetRGBStrokeColor(context, 0, 0, 0, 1);
    CGContextSetRGBFillColor(context, 0, 0, 0, 1);
	CGContextStrokePath(context);
    
	if ([e style] != nil) {
        NSPoint p1,p2,p3;
        
        // draw edge decoration
        switch ([[e style] decorationStyle]) {
            case ED_None:
                break;
            case ED_Tick:
                p1 = [transformer toScreen:[e leftNormal]];
                p2 = [transformer toScreen:[e rightNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextStrokePath(context);
                break;
            case ED_Arrow:
                p1 = [transformer toScreen:[e leftNormal]];
                p2 = [transformer toScreen:[e midTan]];
                p3 = [transformer toScreen:[e rightNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextAddLineToPoint(context, p3.x, p3.y);
                CGContextStrokePath(context);
                break;
        }
        
        // draw arrow head
        switch ([[e style] headStyle]) {
            case AH_None:
                break;
            case AH_Plain:
                p1 = [transformer toScreen:[e leftHeadNormal]];
                p2 = [transformer toScreen:[e head]];
                p3 = [transformer toScreen:[e rightHeadNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextAddLineToPoint(context, p3.x, p3.y);
                CGContextStrokePath(context);
                break;
            case AH_Latex:
                p1 = [transformer toScreen:[e leftHeadNormal]];
                p2 = [transformer toScreen:[e head]];
                p3 = [transformer toScreen:[e rightHeadNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextAddLineToPoint(context, p3.x, p3.y);
                CGContextClosePath(context);
                CGContextFillPath(context);
                break;
        }
        
        // draw arrow tail
        switch ([[e style] tailStyle]) {
            case AH_None:
                break;
            case AH_Plain:
                p1 = [transformer toScreen:[e leftTailNormal]];
                p2 = [transformer toScreen:[e tail]];
                p3 = [transformer toScreen:[e rightTailNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextAddLineToPoint(context, p3.x, p3.y);
                CGContextStrokePath(context);
                break;
            case AH_Latex:
                p1 = [transformer toScreen:[e leftTailNormal]];
                p2 = [transformer toScreen:[e tail]];
                p3 = [transformer toScreen:[e rightTailNormal]];
                CGContextMoveToPoint(context, p1.x, p1.y);
                CGContextAddLineToPoint(context, p2.x, p2.y);
                CGContextAddLineToPoint(context, p3.x, p3.y);
                CGContextClosePath(context);
                CGContextFillPath(context);
                break;
        }
    }
    
	
	CGContextRestoreGState(context);
	
	if ([e hasEdgeNode]) {
        Node *en = [e edgeNode];
		NSPoint mid = [transformer toScreen:[e mid]];
		if (![[en label] isEqual:@""]) {
			[layer drawLabel:[en label]
					 atPoint:mid
				   inContext:context
				  usingTrans:transformer];
		}
	}
	
	EdgeControlLayer *ecl = [edgeControlLayers objectForKey:e];
	[ecl setNeedsDisplay];
}


// draw the graph layer
-(void)drawLayer:(CALayer *)layer inContext:(CGContextRef)context {
	for (Edge* e in [graph edges]) [self drawEdge:e onLayer:layer inContext:context];
	
	for (Node* n in [graph nodes]) [self drawNode:n onLayer:layer inContext:context];
	
	if ([graph hasBoundingBox]) {
		CGRect bbox = NSRectToCGRect(NSIntegralRect(
						[transformer rectToScreen:[graph boundingBox]]));
		CGContextSetRGBStrokeColor(context, 1.0f, 0.7f, 0.5f, 1.0f);
		CGContextSetLineWidth(context, 1.0f);
		CGContextSetShouldAntialias(context, NO);
		CGContextStrokeRect(context, bbox);
		CGContextSetShouldAntialias(context, YES);
	}
	
	if (mouseMode == EdgeDragMode) {
		CGContextMoveToPoint(context, dragOrigin.x, dragOrigin.y);
		CGContextAddLineToPoint(context, dragTarget.x, dragTarget.y);
		CGContextSetLineWidth(context, 2);
		CGContextSetRGBStrokeColor(context, 0, 0, 1, 1);
		CGContextStrokePath(context);
	}
}

// if enabled, suppress the default "bonk" behaviour on key presses
- (void)keyDown:(NSEvent *)theEvent {
	if (!enabled) [super keyDown:theEvent];
}

- (void)delete:(id)sender {
    BOOL didDelete = NO;
    NSString *oldTikz = [graph tikz];
    
	if ([[pickSupport selectedNodes] count] != 0) {
		GraphChange *change = [graph removeNodes:[pickSupport selectedNodes]];
		for (Node *n in [change affectedNodes]) [self removeNodeLayers:n];
		for (Edge *e in [change affectedEdges]) [self removeEdgeLayers:e];
		
		[self refreshLayers];
		[self postGraphChange];
        didDelete = YES;
	}
	
	if ([[pickSupport selectedEdges] count] != 0) {
		[graph removeEdges:[pickSupport selectedEdges]];
		for (Edge *e in [pickSupport selectedEdges]) [self removeEdgeLayers:e];
		[self refreshLayers];
		[self postGraphChange];
        didDelete = YES;
	}
    
    [pickSupport deselectAllNodes];
    [pickSupport deselectAllEdges];
    
    if (didDelete) [self registerUndo:oldTikz withActionName:@"Delete Nodes or Edges"];
}

- (void)keyUp:(NSEvent *)theEvent {
	if (!enabled) return;
	
	id sender = self;
	switch ([theEvent keyCode]) {
		case 51:  // delete
			[self delete:sender]; // "self" is the sender
			break;
		case 1:  // S
			[toolPaletteController setSelectedTool:TikzToolSelect];
			break;
		case 45: // N
		case 9:  // V
			[toolPaletteController setSelectedTool:TikzToolNode];
			break;
		case 14: // E
			[toolPaletteController setSelectedTool:TikzToolEdge];
			//[self updateMouseMode];
			break;
		case 40: // K
			[toolPaletteController setSelectedTool:TikzToolCrop];
			break;
	}
	[self refreshLayers];
}


- (void)deselectAll:(id)sender {
	[pickSupport deselectAllNodes];
	[pickSupport deselectAllEdges];
	
	for (Node *n in [graph nodes]) {
		[[[nodeLayers objectForKey:n] selection] deselect];
	}
	
	for (Edge *e in [graph edges]) {
		[[edgeControlLayers objectForKey:e] deselect];
	}
	
	[self postSelectionChange];
}

- (void)selectAll:(id)sender {
	[pickSupport selectAllNodes:[NSSet setWithArray:[graph nodes]]];
	
	for (Node *n in [graph nodes]) {
		[[[nodeLayers objectForKey:n] selection] select];
	}
	
	[self postSelectionChange];
}


- (void)updateMouseMode {
	switch (toolPaletteController.selectedTool) {
		case TikzToolSelect:
			mouseMode = SelectMode;
			break;
		case TikzToolNode:
			mouseMode = NodeMode;
			break;
		case TikzToolEdge:
			mouseMode = EdgeMode;
			break;
		case TikzToolCrop:
			mouseMode = CropMode;
			break;
	}
}

- (void)setDocumentUndoManager:(NSUndoManager *)um {
	documentUndoManager = um;
}

- (void)copy:(id)sender {
	if ([[pickSupport selectedNodes] count] != 0) {
		Graph *clip = [graph copyOfSubgraphWithNodes:[pickSupport selectedNodes]];
		NSString *tikz = [clip tikz];
		NSData *data = [tikz dataUsingEncoding:NSUTF8StringEncoding];
		//NSLog(@"about to copy: %@", tikz);
		NSPasteboard *cb = [NSPasteboard generalPasteboard];
		[cb declareTypes:[NSArray arrayWithObject:@"tikzpicture"] owner:self];
		[cb setData:data forType:@"tikzpicture"];
	}
}

- (void)cut:(id)sender {
	if ([[pickSupport selectedNodes] count] != 0) {
		[self copy:sender];
		[self delete:sender];
		
		// otherwise, menu will say "Undo Delete Graph"
		[documentUndoManager setActionName:@"Cut Graph"];
	}
}

- (void)paste:(id)sender {
	NSPasteboard *cb = [NSPasteboard generalPasteboard];
	NSString *type = [cb availableTypeFromArray:[NSArray arrayWithObject:@"tikzpicture"]];
	if (type) {
		NSData *data = [cb dataForType:type];
		NSString *tikz = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        //NSLog(@"pasting tikz:\n%@",tikz);
		TikzGraphAssembler *ass = [[TikzGraphAssembler alloc] init];
		if ([ass parseTikz:tikz]) {
            //NSLog(@"tikz pasted:\n%@",tikz);
			Graph *clip = [ass graph];
			
			NSRect graphBounds = [graph bounds];
			NSRect clipBounds = [clip bounds];
			float dx = graphBounds.origin.x +
                       graphBounds.size.width -
                       clipBounds.origin.x + 0.5f;
			[clip shiftNodes:[clip nodes] byPoint:NSMakePoint(dx, 0)];
			
			if ([[clip nodes] count] != 0) {
                NSString *oldTikz = [graph tikz];
				[self deselectAll:self];
                
				// select everything from the clipboard
				for (Node *n in [clip nodes]) {
					[n attachStyleFromTable:[stylePaletteController nodeStyles]];
					[self addNodeLayers:n];
					[pickSupport selectNode:n];
					[[[nodeLayers objectForKey:n] selection] select];
				}
				
				for (Edge *e in [clip edges]) {
                    [e attachStyleFromTable:[stylePaletteController edgeStyles]];
					[self addEdgeLayers:e];
				}
                
                [graph insertGraph:clip];
				
				[self registerUndo:oldTikz withActionName:@"Paste Graph"];
				[self refreshLayers];
				[self postGraphChange];
			}
		} else {
			NSLog(@"Error: couldn't parse tikz picture from clipboard.");
		}
		
	}
}

- (void)bringForward:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph bringNodesForward:[pickSupport selectedNodes]];
    [graph bringEdgesForward:[pickSupport selectedEdges]];
	[self registerUndo:oldTikz withActionName:@"Bring Forward"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)sendBackward:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph sendNodesBackward:[pickSupport selectedNodes]];
    [graph sendEdgesBackward:[pickSupport selectedEdges]];
	[self registerUndo:oldTikz withActionName:@"Send Backward"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)bringToFront:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph bringNodesToFront:[pickSupport selectedNodes]];
    [graph bringEdgesToFront:[pickSupport selectedEdges]];
	[self registerUndo:oldTikz withActionName:@"Bring to Front"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)sendToBack:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph sendNodesToBack:[pickSupport selectedNodes]];
    [graph sendEdgesToBack:[pickSupport selectedEdges]];
	[self registerUndo:oldTikz withActionName:@"Send to Back"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)flipHorizonal:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph flipHorizontalNodes:[pickSupport selectedNodes]];
	[self registerUndo:oldTikz withActionName:@"Flip Horizontal"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)flipVertical:(id)sender {
    NSString *oldTikz = [graph tikz];
	[graph flipVerticalNodes:[pickSupport selectedNodes]];
	[self registerUndo:oldTikz withActionName:@"Flip Vertical"];
	[self postGraphChange];
	[self refreshLayers];
}

- (void)reverseEdgeDirection:(id)sender {
    NSString *oldTikz = [graph tikz];
    
    NSSet *es;
    if ([[pickSupport selectedEdges] count] != 0) {
        es = [pickSupport selectedEdges];
    } else {
        es = [graph incidentEdgesForNodes:[pickSupport selectedNodes]];
    }
    
    for (Edge *e in es) [e reverse];
    
    [self registerUndo:oldTikz withActionName:@"Flip Edge Direction"];
	[self postGraphChange];
	[self refreshLayers];
}

- (BOOL)acceptsFirstResponder { return YES; }
- (BOOL)acceptsFirstMouse:(NSEvent *)theEvent { return YES; }
- (BOOL)canBecomeKeyView { return YES; }


@end
