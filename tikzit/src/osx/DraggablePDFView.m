//
//  PreviewController.h
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

#import "DraggablePDFView.h"

@implementation DraggablePDFView

- (id)initWithFrame:(NSRect)frame
{
    self = [super initWithFrame:frame];
    return self;
}

- (void)drawRect:(NSRect)dirtyRect
{
	[super drawRect:dirtyRect];
}

- (void)mouseDown:(NSEvent *)theEvent
{
    NSRect pageBox = [[[self document] pageAtIndex:0] boundsForBox:kPDFDisplayBoxMediaBox];
    NSRect pageRect= [self convertRect:pageBox fromPage:[[self document] pageAtIndex:0]];
    
    NSArray *fileList = [NSArray arrayWithObjects:[[[self document] documentURL] path], nil];
    NSPasteboard *pboard = [NSPasteboard pasteboardWithName:NSDragPboard];
    [pboard declareTypes:[NSArray arrayWithObject:NSFilenamesPboardType] owner:nil];
    [pboard setPropertyList:fileList forType:NSFilenamesPboardType];
    
    [self dragImage:[[NSImage alloc] initWithData:[[self document] dataRepresentation]]
                 at:pageRect.origin
             offset:pageRect.size
              event:theEvent
         pasteboard:pboard
             source:self
          slideBack:YES];
    
    return;
}

@end
