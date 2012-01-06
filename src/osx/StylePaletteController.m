//
//  StylePaletteController.m
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

#import "StylePaletteController.h"
#import "TikzDocument.h"
#import "SFBInspectors/SFBInspectorView.h"
#import "PickSupport.h"
#import "Node.h"
#import "Edge.h"
#import "NodeStyle.h"
#import "GraphicsView.h"
#import "GraphElementProperty.h"
#import "Shape.h"

@implementation StylePaletteController

@synthesize nodeStyles, edgeStyles;

- (id)initWithWindowNibName:(NSString *)windowNibName
                 supportDir:(NSString*)supportDir
{
	if (self = [super initWithWindowNibName:windowNibName]) {
        NSString *ns = [supportDir stringByAppendingPathComponent:@"nodeStyles.plist"];
        NSString *es = [supportDir stringByAppendingPathComponent:@"edgeStyles.plist"];
		nodeStyles = (NSMutableArray*)[NSKeyedUnarchiver
                            unarchiveObjectWithFile:ns];
        edgeStyles = (NSMutableArray*)[NSKeyedUnarchiver
                            unarchiveObjectWithFile:es];
		
        if (nodeStyles == nil) nodeStyles = [NSMutableArray array];
		if (edgeStyles == nil) edgeStyles = [NSMutableArray array];
        
		[[self window] setLevel:NSNormalWindowLevel];
		[self showWindow:self];
	}
	
	return self;
}

- (void)windowDidLoad {
	[[self window] setMovableByWindowBackground:YES];
	[shapeDropdown addItemsWithTitles:[[Shape shapeDictionary] allKeys]];
	if ([self activeNodeStyle] != nil) {
		[shapeDropdown setTitle:[[self activeNodeStyle] shapeName]];
	}
	
	[nodeStyleInspectorView addInspectorPane:nodeStyleView
								   title:@"Node Styles"];
	
    [nodeStyleInspectorView addInspectorPane:edgeStyleView
								   title:@"Edge Styles"];
    
	[super windowDidLoad];
}

- (void)saveStyles:(NSString*)supportDir {
    NSString *ns = [supportDir stringByAppendingPathComponent:@"nodeStyles.plist"];
    NSString *es = [supportDir stringByAppendingPathComponent:@"edgeStyles.plist"];
	[NSKeyedArchiver archiveRootObject:nodeStyles toFile:ns];
    [NSKeyedArchiver archiveRootObject:edgeStyles toFile:es];
}

- (IBAction)refreshCollection:(id)sender {
	[collectionView setNeedsDisplay:YES];
}


- (BOOL)documentActive {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	return dc.currentDocument != nil;
}

-(BOOL)collectionView:(NSCollectionView*)collectionView canDragItemsAtIndexes:(NSIndexSet*)indexes withEvent:(NSEvent*)event {
    return YES;
}


//===========================
//= setting SVG-safe colors =
//===========================
- (IBAction)setFillToClosestHashed:(id)sender {
	NSArray *sel = [nodeStyleArrayController selectedObjects];
	if ([sel count] != 0) {
		NodeStyle *sty = [sel objectAtIndex:0];
		[sty willChangeValueForKey:@"fillColor"];
		[sty willChangeValueForKey:@"fillColorIsKnown"];
		[sty.fillColorRGB setToClosestHashed];
		[sty didChangeValueForKey:@"fillColor"];
		[sty didChangeValueForKey:@"fillColorIsKnown"];
	}
}

- (IBAction)setStrokeToClosestHashed:(id)sender {
	NSArray *sel = [nodeStyleArrayController selectedObjects];
	if ([sel count] != 0) {
		NodeStyle *sty = [sel objectAtIndex:0];
		[sty willChangeValueForKey:@"strokeColor"];
		[sty willChangeValueForKey:@"strokeColorIsKnown"];
		[sty.strokeColorRGB setToClosestHashed];
		[sty didChangeValueForKey:@"strokeColor"];
		[sty didChangeValueForKey:@"strokeColorIsKnown"];
	}
}

//=================================================
//= setting filter predicates for nodes and edges =
//=================================================
- (NSString*)displayedNodeStyleCategory {
	return displayedNodeStyleCategory;
}

- (void)setDisplayedNodeStyleCategory:(NSString *)cat {
	[self willChangeValueForKey:@"displayedNodeStylePredicate"];
	displayedNodeStyleCategory = cat;
	[self didChangeValueForKey:@"displayedNodeStylePredicate"];
}

- (NSString*)displayedEdgeStyleCategory {
	return displayedEdgeStyleCategory;
}

- (void)setDisplayedEdgeStyleCategory:(NSString *)cat {
	[self willChangeValueForKey:@"displayedEdgeStylePredicate"];
	displayedEdgeStyleCategory = cat;
	[self didChangeValueForKey:@"displayedEdgeStylePredicate"];
}

- (NSPredicate*)displayedNodeStylePredicate {
	return [NSPredicate predicateWithFormat:@"category == %@", displayedNodeStyleCategory];
}

- (NSPredicate*)displayedEdgeStylePredicate {
	return [NSPredicate predicateWithFormat:@"category == %@", displayedEdgeStyleCategory];
}


//==============================
//= getting and setting styles =
//==============================

- (IBAction)applyActiveNodeStyle:(id)sender {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		[[doc graphicsView] applyStyleToSelectedNodes:[self activeNodeStyle]];
	}
	
	[[doc graphicsView] postSelectionChange];
}

- (IBAction)clearActiveNodeStyle:(id)sender {
	[self setActiveNodeStyle:nil];
	
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		[[doc graphicsView] applyStyleToSelectedNodes:nil];
	}
	
	[[doc graphicsView] postSelectionChange];
}

- (NodeStyle*)activeNodeStyle {
	NSArray *sel = [filteredNodeStyleArrayController selectedObjects];
	if ([sel count] == 0) return nil;
	else return [sel objectAtIndex:0];
}

- (void)setActiveNodeStyle:(NodeStyle*)style {
	if ([nodeStyles containsObject:style]) {
		[filteredNodeStyleArrayController setSelectedObjects:[NSArray arrayWithObject:style]];
	} else {
		[filteredNodeStyleArrayController setSelectedObjects:[NSArray array]];
	}
}

- (IBAction)appleActiveEdgeStyle:(id)sender {
    NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		[[doc graphicsView] applyStyleToSelectedEdges:[self activeEdgeStyle]];
	}
}

- (IBAction)clearActiveEdgeStyle:(id)sender {
    [self setActiveEdgeStyle:nil];
    [self appleActiveEdgeStyle:sender];
}

- (EdgeStyle*)activeEdgeStyle {
	NSArray *sel = [filteredEdgeStyleArrayController selectedObjects];
	if ([sel count] == 0) return nil;
	else return [sel objectAtIndex:0];
}

- (void)setActiveEdgeStyle:(EdgeStyle*)style {
	if ([edgeStyles containsObject:style]) {
		[filteredEdgeStyleArrayController setSelectedObjects:[NSArray arrayWithObject:style]];
	} else {
		[filteredEdgeStyleArrayController setSelectedObjects:[NSArray array]];
	}
}


//=================
//= adding styles =
//=================

- (IBAction)addEdgeStyle:(id)sender {
    EdgeStyle *sty = [[EdgeStyle alloc] init];
	[sty setCategory:displayedEdgeStyleCategory];
	[edgeStyleArrayController addObject:sty];
	[self setActiveEdgeStyle:sty];
}

- (IBAction)addNodeStyle:(id)sender {
	NodeStyle *sty = [[NodeStyle alloc] init];
	[sty setCategory:displayedNodeStyleCategory];
	[nodeStyleArrayController addObject:sty];
	[self setActiveNodeStyle:sty];
}


@end
