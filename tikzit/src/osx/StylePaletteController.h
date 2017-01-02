//
//  StylePaletteController.h
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
#import "NodeStyle.h"
#import "EdgeStyle.h"

@class SFBInspectorView;

@interface StylePaletteController : NSWindowController {
	NSMutableArray *nodeStyles;
    NSMutableArray *edgeStyles;
	IBOutlet NSArrayController *nodeStyleArrayController;
	IBOutlet NSArrayController *filteredNodeStyleArrayController;
    IBOutlet NSArrayController *edgeStyleArrayController;
    IBOutlet NSArrayController *filteredEdgeStyleArrayController;
	IBOutlet NSCollectionView *collectionView;
	IBOutlet SFBInspectorView *nodeStyleInspectorView;
	IBOutlet NSView *nodeStyleView;
    IBOutlet NSView *edgeStyleView;
	IBOutlet NSPopUpButton *shapeDropdown;
	NSString *displayedNodeStyleCategory;
    NSString *displayedEdgeStyleCategory;
}

@property (strong) NSMutableArray *nodeStyles;
@property (strong) NSMutableArray *edgeStyles;
@property (readonly) BOOL documentActive;
@property (strong) NodeStyle *activeNodeStyle;
@property (strong) EdgeStyle *activeEdgeStyle;
@property (copy) NSString *displayedNodeStyleCategory;
@property (copy) NSString *displayedEdgeStyleCategory;
@property (readonly) NSPredicate *displayedNodeStylePredicate;
@property (readonly) NSPredicate *displayedEdgeStylePredicate;

//@property NSString *nodeLabel;

- (id)initWithWindowNibName:(NSString *)windowNibName
                 supportDir:(NSString*)supportDir;
- (void)saveStyles:(NSString *)plist;

- (IBAction)refreshCollection:(id)sender;

- (IBAction)applyActiveNodeStyle:(id)sender;
- (IBAction)clearActiveNodeStyle:(id)sender;
- (IBAction)addNodeStyle:(id)sender;

- (IBAction)appleActiveEdgeStyle:(id)sender;
- (IBAction)clearActiveEdgeStyle:(id)sender;
- (IBAction)addEdgeStyle:(id)sender;
- (void)setActiveEdgeStyle:(EdgeStyle*)style;

- (IBAction)setFillToClosestHashed:(id)sender;
- (IBAction)setStrokeToClosestHashed:(id)sender;


//- (IBAction)changeShape:(id)sender;


@end
