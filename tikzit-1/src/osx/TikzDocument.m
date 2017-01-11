//
//  TikzDocument.m
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

#import "TikzDocument.h"
#import "TikzWindowController.h"

@implementation TikzDocument

@synthesize tikz;

- (id)init {
    self = [super init];
    if (self) {
		tikz = nil;
    }
    return self;
}

//- (NSString *)windowNibName {
//    // Override returning the nib file name of the document
//    // If you need to use a subclass of NSWindowController or if your document supports multiple NSWindowControllers, you should remove this method and override -makeWindowControllers instead.
//    return @"TikzDocument";
//}

- (void)makeWindowControllers {
	TikzWindowController *wc = [[TikzWindowController alloc] initWithDocument:self];
	[self addWindowController:wc];
}

- (void)windowControllerDidLoadNib:(NSWindowController *) aController {
    [super windowControllerDidLoadNib:aController];
    [[self graphicsView] refreshLayers];
    // Add any code here that needs to be executed once the windowController has loaded the document's window.
}

- (NSData *)dataOfType:(NSString *)typeName error:(NSError **)outError {
	TikzWindowController *wc =
		(TikzWindowController*)[[self windowControllers] objectAtIndex:0];
	NSData *outData = [[[wc tikzSourceController] tikz] dataUsingEncoding:NSUTF8StringEncoding];
	
    if ( outError != NULL ) {
		*outError = [NSError errorWithDomain:NSOSStatusErrorDomain code:unimpErr userInfo:NULL];
	}
	return outData;
}

- (BOOL)readFromData:(NSData *)data ofType:(NSString *)typeName error:(NSError **)outError {
	tikz = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
	
    if ( outError != NULL ) {
		*outError = [NSError errorWithDomain:NSOSStatusErrorDomain code:unimpErr userInfo:NULL];
	}
	
    return YES;
}

- (GraphicsView*)graphicsView {
	TikzWindowController *wc =
		(TikzWindowController*)[[self windowControllers] objectAtIndex:0];
	return [wc graphicsView];
}


@end
