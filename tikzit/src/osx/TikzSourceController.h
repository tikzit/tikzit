//
//  TikzSourceController.h
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

#import "GraphicsView.h"
#import "ParseErrorView.h"

@interface TikzSourceController : NSObject {
	GraphicsView *graphicsView;
	NSTextView *sourceView;
	NSAttributedString *source;
	NSTextField *status;
	NSDictionary *textAttrs;
	NSColor *successColor;
	NSColor *failedColor;
	NSTextField *errorMessage;
	ParseErrorView *errorNotification;
    
	NSUndoManager *documentUndoManager;
	
	BOOL tikzChanged;
	BOOL justUndid;
	
	NSError *lastError;
}

@property BOOL tikzChanged;
@property IBOutlet GraphicsView *graphicsView;
@property IBOutlet NSTextView *sourceView;
@property IBOutlet NSTextField *status;
@property NSUndoManager *documentUndoManager;
@property (copy) NSAttributedString *source;
@property (copy) NSString *tikz;
@property IBOutlet ParseErrorView *errorNotification;
@property IBOutlet NSTextField *errorMessage;

- (void)updateTikzFromGraph;
- (void)graphChanged:(NSNotification*)n;

- (IBAction)closeParseError:(id)pId;

// called by code, these do not register an undo
- (BOOL)tryParseTikz;
- (void)doRevertTikz;

// called by user, these do register an undo
- (void)parseTikz:(id)sender;
- (void)revertTikz:(id)sender;

@end
