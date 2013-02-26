//
//  TikzSourceController.m
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

#import "TikzSourceController.h"
#import "Graph.h"

@implementation TikzSourceController

@synthesize graphicsView, sourceView, source, status;
@synthesize documentUndoManager, tikzChanged;
@synthesize errorMessage, errorNotification;

- (void)endEditing {
	NSResponder *res = [[sourceView window] firstResponder];
	[[sourceView window] makeFirstResponder:nil];
	[[sourceView window] makeFirstResponder:res];
}

- (void)undoParseTikz:(Graph *)oldGraph {
	[graphicsView setGraph:oldGraph];
	[graphicsView setEnabled:NO];
	[graphicsView postGraphChange];
	[graphicsView refreshLayers];
	
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(parseTikz:)
										 object:self];
	[documentUndoManager setActionName:@"Parse Tikz"];
}

- (void)undoRevertTikz:(NSString*)oldTikz {
	[self setTikz:oldTikz];
	[graphicsView setEnabled:NO];
	[graphicsView refreshLayers];
	
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(revertTikz:)
										 object:self];
	[documentUndoManager setActionName:@"Revert Tikz"];
}

- (void)undoTikzChange:(id)ignore {
	[graphicsView setEnabled:YES];
	[graphicsView refreshLayers];
	[self endEditing];
	[self updateTikzFromGraph];
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(redoTikzChange:)
										 object:nil];
	[documentUndoManager setActionName:@"Tikz Change"];
}

- (void)redoTikzChange:(id)ignore {
	[graphicsView setEnabled:NO];
	[graphicsView refreshLayers];
	[documentUndoManager registerUndoWithTarget:self
									   selector:@selector(undoTikzChange:)
										 object:nil];
	[documentUndoManager setActionName:@"Tikz Change"];
}


- (void)awakeFromNib {
	justUndid = NO;
	assembler = [[TikzGraphAssembler alloc] init];
	
	successColor = [NSColor colorWithCalibratedRed:0.0f
											 green:0.5f
											  blue:0.0f
											 alpha:1.0f];
	failedColor = [NSColor redColor];
	
	NSFont *font = [NSFont userFixedPitchFontOfSize:11.0f];
	
	if (font != nil) {
		textAttrs = [NSDictionary dictionaryWithObject:font
								forKey:NSFontAttributeName];
	} else {
		NSLog(@"WARNING: couldn't find monospaced font.");
		textAttrs = [NSDictionary dictionary];
	}
	
	
	[self graphChanged:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self
											 selector:@selector(graphChanged:)
												 name:@"GraphChanged"
											   object:graphicsView];
}

- (void)setTikz:(NSString *)str {
	[self willChangeValueForKey:@"source"];
	source = [[NSAttributedString alloc] initWithString:str attributes:textAttrs];
	[self didChangeValueForKey:@"source"];
}

- (NSString*)tikz {
	return [source string];
}

- (void)updateTikzFromGraph {
 	[self setTikz:[[graphicsView graph] tikz]];
}

- (void)graphChanged:(NSNotification*)n {
	if ([graphicsView enabled]) [self updateTikzFromGraph];
}

- (IBAction)closeParseError:(id)pId{
   [errorNotification setHidden:TRUE];
}

- (void)textDidBeginEditing:(NSNotification *)notification {
	if ([graphicsView enabled]) {
		[graphicsView setEnabled:NO];
		[graphicsView refreshLayers];
		[documentUndoManager registerUndoWithTarget:self
										   selector:@selector(undoTikzChange:)
											 object:nil];
		[documentUndoManager setActionName:@"Tikz Change"];
	}
}

- (BOOL)tryParseTikz {
    BOOL success = [assembler parseTikz:[self tikz]];
    
    if (success) {
        [graphicsView deselectAll:self];
        [graphicsView setGraph:[assembler graph]];
        [graphicsView refreshLayers];
        [self doRevertTikz];
    }
    
    return success;
}

- (void)doRevertTikz {
    [self updateTikzFromGraph];
    [self endEditing];
    [graphicsView setEnabled:YES];
    [graphicsView refreshLayers];
    [status setStringValue:@""];
}

- (void)parseTikz:(id)sender {
	if (![graphicsView enabled]) {
        Graph *oldGraph = [graphicsView graph];
		if ([self tryParseTikz]) {
            [self endEditing];
            [documentUndoManager registerUndoWithTarget:self
                                               selector:@selector(undoParseTikz:)
                                                 object:oldGraph];
            [documentUndoManager setActionName:@"Parse Tikz"];
            
            [status setStringValue:@"success"];
            [status setTextColor:successColor];
            
            [errorNotification setHidden:TRUE];
        } else {
            [status setStringValue:@"parse error"];
            [status setTextColor:failedColor];
            
            
            NSLog(@"Parse error: %@",[assembler lastError]);
            
            NSError *e = [assembler lastError];
            
            [errorMessage setStringValue:[[[assembler lastError] userInfo] valueForKey:NSLocalizedDescriptionKey]];
            [errorNotification setHidden:FALSE];
        }
	}
}

- (void)revertTikz:(id)sender {
	if (![graphicsView enabled]) {
		NSString *oldTikz = [[self tikz] copy];
		[self doRevertTikz];
		
		[documentUndoManager registerUndoWithTarget:self
										   selector:@selector(undoRevertTikz:)
											 object:oldTikz];
		[documentUndoManager setActionName:@"Revert Tikz"];
	}
}

- (void)finalize {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[super finalize];
}

@end
