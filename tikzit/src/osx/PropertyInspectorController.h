//
//  PropertyInspectorController.h
//  TikZiT
//
//  Created by Aleks Kissinger on 17/07/2011.
//  Copyright 2011 Aleks Kissinger. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "NodeStyle.h"
#import "GraphElementData.h"

@class SFBInspectorView;
@class StylePaletteController;

@interface PropertyInspectorController : NSWindowController {
	IBOutlet SFBInspectorView *propertyInspectorView;
	IBOutlet NSView *nodePropertiesView;
	IBOutlet NSView *graphPropertiesView;
	IBOutlet NSView *edgePropertiesView;
    IBOutlet NSComboBox *sourceAnchorComboBox;
    IBOutlet NSComboBox *targetAnchorComboBox;
	IBOutlet NSTextField *edgeNodeLabelField;
	IBOutlet NSButton *edgeNodeCheckbox;
	IBOutlet NSArrayController *nodeDataArrayController;
	IBOutlet NSArrayController *graphDataArrayController;
	IBOutlet NSArrayController *edgeDataArrayController;
	IBOutlet NSArrayController *edgeNodeDataArrayController;
	
    NSMutableArray *sourceAnchorNames;
    IBOutlet NSArrayController *sourceAnchorNamesArrayController;
    
    NSMutableArray *targetAnchorNames;
    IBOutlet NSArrayController *targetAnchorNamesArrayController;
    
    NSMutableArray *selectedNodes;
    IBOutlet NSArrayController *selectedNodesArrayController;
    
    NSMutableArray *selectedEdges;
    IBOutlet NSArrayController *selectedEdgesArrayController;
    
    // this data lists exists solely for displaying messages in disabled data tables
    GraphElementData *noSelection;
    GraphElementData *multipleSelection;
    GraphElementData *noEdgeNode;
    GraphElementData *noGraph;
    
    
	// used to get access to the global style table
	StylePaletteController *stylePaletteController;
}

//@property (readonly) BOOL enableNodeDataControls;
//@property (readonly) BOOL enableEdgeDataControls;
@property (strong) NSMutableArray *selectedNodes;
@property (strong) NSMutableArray *selectedEdges;
@property (strong) NSMutableArray *sourceAnchorNames;
@property (strong) NSMutableArray *targetAnchorNames;
@property (strong) StylePaletteController *stylePaletteController;

- (id)initWithWindowNibName:(NSString *)windowNibName;
- (void)graphSelectionChanged:(NSNotification*)notification;

- (IBAction)addNodeProperty:(id)sender;
- (IBAction)addNodeAtom:(id)sender;
- (IBAction)removeNodeProperty:(id)sender;

- (IBAction)addGraphProperty:(id)sender;
- (IBAction)addGraphAtom:(id)sender;
- (IBAction)removeGraphProperty:(id)sender;

- (IBAction)addEdgeProperty:(id)sender;
- (IBAction)addEdgeAtom:(id)sender;
- (IBAction)removeEdgeProperty:(id)sender;

- (IBAction)addEdgeNodeProperty:(id)sender;
- (IBAction)addEdgeNodeAtom:(id)sender;
- (IBAction)removeEdgeNodeProperty:(id)sender;

//- (IBAction)addRemoveChildNode:(id)sender;
- (IBAction)refreshDocument:(id)sender;

@end
