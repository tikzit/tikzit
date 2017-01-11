//
//  TikzWindowController.h
//  TikZiT
//
//  Created by Aleks Kissinger on 26/01/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@class TikzDocument, GraphicsView, TikzSourceController;

@interface TikzWindowController : NSWindowController {
	GraphicsView *__weak graphicsView;
	TikzSourceController *__weak tikzSourceController;
	TikzDocument *document;
}

@property (weak) IBOutlet GraphicsView *graphicsView;
@property (weak) IBOutlet TikzSourceController *tikzSourceController;

- (id)initWithDocument:(TikzDocument*)doc;

// pass these straight to the tikz source controller
- (void)parseTikz:(id)sender;
- (void)revertTikz:(id)sender;
- (void)zoomIn:(id)sender;
- (void)zoomOut:(id)sender;
- (void)zoomToActualSize:(id)sender;

@end
