//
//  GraphicsView.h
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

#import <Cocoa/Cocoa.h>
#import <QuartzCore/CoreAnimation.h>
#import "PickSupport.h"
#import "Grid.h"
#import "Transformer.h"
#import "Graph.h"
#import "NodeStyle.h"
#import "StylePaletteController.h"
#import "ToolPaletteController.h"
#import "SelectBoxLayer.h"

// mouse modes, corresponding to different tools. format: (tool)[sub-mode]Mode
typedef enum {
	SelectMode = 0x10,
	SelectBoxMode = 0x11,
	SelectMoveMode = 0x12,
	SelectEdgeBendMode = 0x14,
	
	NodeMode = 0x20,
	
	EdgeMode = 0x40,
	EdgeDragMode = 0x41,
	
	CropMode = 0x80,
	CropDragMode = 0x81
} MouseMode;

@class TikzSourceController;

@interface GraphicsView : NSView {
	BOOL enabled;
	
	IBOutlet NSApplication *application;
	StylePaletteController *stylePaletteController;
	ToolPaletteController *toolPaletteController;
    
    BOOL frameMoveMode;
	
	Graph *graph;
    NSString *graphTikzOnMouseDown;
	PickSupport *pickSupport;
	//NSMapTable *nodeSelectionLayers;
	NSMapTable *edgeControlLayers;
	NSMapTable *nodeLayers;
	NSPoint dragOrigin;
	NSPoint dragTarget;
    NSPoint oldTransformerOrigin;
    NSPoint oldMainOrigin;
    NSRect oldBounds;
	//NSRect selectionBox;
	Transformer *transformer;
	
	CALayer *mainLayer;
	CALayer *gridLayer;
	CALayer *graphLayer;
	CALayer *hudLayer;
	SelectBoxLayer *selectionLayer;
    
	MouseMode mouseMode;
	Node *leaderNode;
	Grid *grid;
	
	Edge *modifyEdge;
	BOOL firstControlPoint;
	
	int bboxLeftRight;
	int bboxBottomTop;
	
	NSUndoManager *documentUndoManager;
	NSPoint startPoint;
    
    TikzSourceController *tikzSourceController;
}

@property BOOL enabled;
@property Graph *graph;
@property IBOutlet TikzSourceController *tikzSourceController;
@property (readonly) Transformer *transformer;
@property (readonly) PickSupport *pickSupport;

- (void)setDocumentUndoManager:(NSUndoManager*)um;
- (void)applyStyleToSelectedNodes:(NodeStyle*)style;
- (void)applyStyleToSelectedEdges:(EdgeStyle*)style;

- (void)updateMouseMode;
- (void)refreshLayers;

//- (void)registerUndo:(GraphChange *)change withActionName:(NSString*)name;
- (void)registerUndo:(NSString*)oldTikz withActionName:(NSString*)name;
//- (void)undoGraphChange:(GraphChange *)change;
- (void)undoGraphChange:(NSString*)oldTikz;
- (void)postGraphChange;
- (void)postSelectionChange;

- (void)deselectAll:(id)sender;
- (void)selectAll:(id)sender;
- (void)cut:(id)sender;
- (void)copy:(id)sender;
- (void)paste:(id)sender;
- (void)delete:(id)sender;
- (void)bringForward:(id)sender;
- (void)flipHorizonal:(id)sender;
- (void)flipVertical:(id)sender;
- (void)reverseEdgeDirection:(id)sender;

@end
