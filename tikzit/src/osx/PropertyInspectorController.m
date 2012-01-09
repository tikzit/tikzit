//
//  PropertyInspectorController.m
//  TikZiT
//
//  Created by Aleks Kissinger on 17/07/2011.
//  Copyright 2011 Aleks Kissinger. All rights reserved.
//

#import "PropertyInspectorController.h"
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

@implementation PropertyInspectorController

@synthesize stylePaletteController;
@synthesize selectedNodes, selectedEdges;

- (id)initWithWindowNibName:(NSString *)windowNibName {
	[super initWithWindowNibName:windowNibName];
    
    noSelection = [[GraphElementData alloc] init];
    [noSelection setProperty:@"" forKey:@"No Selection"];
    multipleSelection = [[GraphElementData alloc] init];
    [multipleSelection setProperty:@"" forKey:@"Mult. Selection"];
    noEdgeNode = [[GraphElementData alloc] init];
    [noEdgeNode setProperty:@"" forKey:@"No Child"];
    noGraph = [[GraphElementData alloc] init];
    [noGraph setProperty:@"" forKey:@"No Graph"];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(graphSelectionChanged:)
                                                 name:@"SelectionChanged"
                                               object:nil];
    
//    [[NSDocumentController sharedDocumentController] addObserver:self
//                                                      forKeyPath:@"currentDocument"
//                                                         options:NSKeyValueObservingOptionNew
//                                                         context:NULL];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(graphSelectionChanged:)
                                                 name:@"NSWindowDidBecomeMainNotification"
                                               object:nil];
    
    
    
    
    [[self window] setLevel:NSNormalWindowLevel];
    [self showWindow:self];
	return self;
}

- (void)observeValueForKeyPath:(NSString*)keyPath
                      ofObject:(id)object
                        change:(NSDictionary*)change
                       context:(void*)context {
    [self graphSelectionChanged:nil];
}

//- (void)willChangeValueForKey:(NSString *)key {
//    [super willChangeValueForKey:key];
//    NSLog(@"will: %@",key);
//}
//
//- (void)didChangeValueForKey:(NSString *)key {
//    [super didChangeValueForKey:key];
//    NSLog(@"did: %@",key);
//}

- (void)windowDidLoad {
	[[self window] setMovableByWindowBackground:YES];
	
	[propertyInspectorView addInspectorPane:graphPropertiesView
									  title:@"Graph Properties"];
	[propertyInspectorView addInspectorPane:nodePropertiesView
									  title:@"Node Properties"];
	[propertyInspectorView addInspectorPane:edgePropertiesView
									  title:@"Edge Properties"];
	[super windowDidLoad];
}

- (IBAction)refreshDocument:(id)sender {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		[[doc graphicsView] postGraphChange];
		[[doc graphicsView] refreshLayers];
	}
}


- (void)updateGraphFields {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		[graphDataArrayController setContent:[[[doc graphicsView] graph] data]];
        [graphDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
        [graphDataArrayController setEditable:YES];
	} else {
        [graphDataArrayController setContent:noGraph];
        [graphDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
        [graphDataArrayController setEditable:NO];
    }
}

- (void)updateNodeFields {
    NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	if (doc != nil) {
        NSSet *sel = [[[doc graphicsView] pickSupport] selectedNodes];
        [self setSelectedNodes:[[sel allObjects] mutableCopy]];
        [selectedNodesArrayController setSelectedObjects:selectedNodes];
        if ([sel count] == 1) {
            Node *n = [sel anyObject];
            [nodeDataArrayController setContent:[n data]];
            [nodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [nodeDataArrayController setEditable:YES];
        } else if ([sel count] == 0) {
            [nodeDataArrayController setContent:noSelection];
            [nodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [nodeDataArrayController setEditable:NO];
        } else {
            [nodeDataArrayController setContent:multipleSelection];
            [nodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [nodeDataArrayController setEditable:NO];
        }
    } else {
        [nodeDataArrayController setContent:noGraph];
        [nodeDataArrayController setEditable:NO];
    }
}

- (void)updateEdgeFields {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	
	if (doc != nil) {
		NSSet *sel = [[[doc graphicsView] pickSupport] selectedEdges];
        [self setSelectedEdges:[[sel allObjects] mutableCopy]];
        [selectedEdgesArrayController setSelectedObjects:selectedEdges];
		if ([sel count] == 1) {
			Edge *e = [sel anyObject];
			[edgeDataArrayController setContent:[e data]];
            [edgeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [edgeDataArrayController setEditable:YES];
			if ([e hasEdgeNode]) {
				Node *n = [e edgeNode];
				[edgeNodeDataArrayController setContent:[n data]];
                [edgeNodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
                [edgeNodeDataArrayController setEditable:YES];
			} else {
				[edgeNodeDataArrayController setContent:noEdgeNode];
                [edgeNodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
                [edgeNodeDataArrayController setEditable:NO];
			}
		} else if ([sel count] == 0) {
			[edgeDataArrayController setContent:noSelection];
            [edgeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [edgeDataArrayController setEditable:NO];
			[edgeNodeDataArrayController setContent:noSelection];
            [edgeNodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [edgeNodeDataArrayController setEditable:NO];
		} else {
            [edgeDataArrayController setContent:multipleSelection];
            [edgeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [edgeDataArrayController setEditable:NO];
			[edgeNodeDataArrayController setContent:multipleSelection];
            [edgeNodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
            [edgeNodeDataArrayController setEditable:NO];
        }
	} else {
        [edgeDataArrayController setContent:noGraph];
        [edgeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
        [edgeDataArrayController setEditable:NO];
        [edgeNodeDataArrayController setContent:noGraph];
        [edgeNodeDataArrayController setSelectionIndexes:[NSIndexSet indexSet]];
        [edgeNodeDataArrayController setEditable:NO];
    }
}

- (void)graphSelectionChanged:(NSNotification*)notification {
	[self updateNodeFields];
	[self updateEdgeFields];
	[self updateGraphFields];
}

- (void)controlTextDidEndEditing:(NSNotification*)notification {
	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
	if (doc != nil) {
		PickSupport *pick = [[doc graphicsView] pickSupport];
		for (Node *n in [pick selectedNodes]) {
			[n attachStyleFromTable:[stylePaletteController nodeStyles]];
		}
        
        for (Edge *e in [pick selectedEdges]) {
            [e attachStyleFromTable:[stylePaletteController edgeStyles]];
        }
	}
	
	[self refreshDocument:[notification object]];
}

- (void)addPropertyToAC:(NSArrayController*)ac {
	[ac addObject:[[GraphElementProperty alloc] initWithPropertyValue:@"val" forKey:@"new_property"]];
	[self refreshDocument:nil];
}

- (void)addAtomToAC:(NSArrayController*)ac {
	[ac addObject:[[GraphElementProperty alloc] initWithAtomName:@"new_atom"]];
	[self refreshDocument:nil];
}

- (void)removeFromAC:(NSArrayController*)ac {
	[ac remove:nil];
	[self refreshDocument:nil];
}

- (IBAction)addNodeProperty:(id)sender { [self addPropertyToAC:nodeDataArrayController]; }
- (IBAction)addNodeAtom:(id)sender { [self addAtomToAC:nodeDataArrayController]; }
- (IBAction)removeNodeProperty:(id)sender { [self removeFromAC:nodeDataArrayController]; }

- (IBAction)addGraphProperty:(id)sender { [self addPropertyToAC:graphDataArrayController]; }
- (IBAction)addGraphAtom:(id)sender { [self addAtomToAC:graphDataArrayController]; }
- (IBAction)removeGraphProperty:(id)sender { [self removeFromAC:graphDataArrayController]; }

- (IBAction)addEdgeProperty:(id)sender { [self addPropertyToAC:edgeDataArrayController]; }
- (IBAction)addEdgeAtom:(id)sender { [self addAtomToAC:edgeDataArrayController]; }
- (IBAction)removeEdgeProperty:(id)sender { [self removeFromAC:edgeDataArrayController]; }

- (IBAction)addEdgeNodeProperty:(id)sender { [self addPropertyToAC:edgeNodeDataArrayController]; }
- (IBAction)addEdgeNodeAtom:(id)sender { [self addAtomToAC:edgeNodeDataArrayController]; }
- (IBAction)removeEdgeNodeProperty:(id)sender { [self removeFromAC:edgeNodeDataArrayController]; }

//- (BOOL)enableEdgeDataControls {
//	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
//	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
//	
//	if (doc != nil) {
//		return ([[[[doc graphicsView] pickSupport] selectedEdges] count] == 1);
//	} else {
//		return NO;
//	}
//}
//
//- (BOOL)enableEdgeNodeDataControls {
//	NSDocumentController *dc = [NSDocumentController sharedDocumentController];
//	TikzDocument *doc = (TikzDocument*)[dc currentDocument];
//	
//	if (doc != nil) {
//		PickSupport *pick = [[doc graphicsView] pickSupport];
//		if ([[pick selectedEdges] count] == 1) {
//			return ([[[pick selectedEdges] anyObject] hasEdgeNode]);
//		} else {
//			return NO;
//		}
//	} else {
//		return NO;
//	}
//}

@end
