//
//  TikzWindowController.m
//  TikZiT
//
//  Created by Aleks Kissinger on 26/01/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import "TikzWindowController.h"
#import "TikzDocument.h"
#import "GraphicsView.h"
#import "TikzSourceController.h"

@implementation TikzWindowController

@synthesize graphicsView, tikzSourceController;

- (id)initWithDocument:(TikzDocument*)doc {
	[super initWithWindowNibName:@"TikzDocument"];
	document = doc;
	return self;
}

- (void)awakeFromNib {	
	if ([document tikz] != nil) {
		[graphicsView setEnabled:NO];
		[tikzSourceController setTikz:[document tikz]];
		[tikzSourceController parseTikz:self];
	}
	
	[graphicsView setDocumentUndoManager:[document undoManager]];
	[tikzSourceController setDocumentUndoManager:[document undoManager]];
}

- (void)parseTikz:(id)sender {
	[tikzSourceController parseTikz:sender];
}

- (void)revertTikz:(id)sender {
	[tikzSourceController revertTikz:sender];
}

- (void)previewTikz:(id)sender {
	PreviewController *pc = [PreviewController defaultPreviewController];
	if (![[pc window] isVisible]) [pc showWindow:sender];
	[pc buildTikz:[tikzSourceController tikz]];
}

- (void)zoomIn:(id)sender {
    float scale = [[graphicsView transformer] scale] * 1.25f;
	[[graphicsView transformer] setScale:scale];
	[graphicsView refreshLayers];
}

- (void)zoomOut:(id)sender {
    float scale = [[graphicsView transformer] scale] * 0.8f;
	[[graphicsView transformer] setScale:scale];
	[graphicsView refreshLayers];
}

- (void)zoomToActualSize:(id)sender {
    [[graphicsView transformer] setScale:50.0f];
	[graphicsView refreshLayers];
}

@end
