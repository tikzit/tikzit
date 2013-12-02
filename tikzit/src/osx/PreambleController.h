//
//  PreambleController.h
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
#import "Preambles.h"
#import "Preambles+Coder.h"

@interface PreambleController : NSViewController {
	Preambles *preambles;
	IBOutlet NSTextView *textView;
	IBOutlet NSDictionaryController *preambleDictionaryController;

	NSDictionary *textAttrs;
	NSAttributedString *preambleText;
	NSColor *ghostColor;
	NSIndexSet *selectionIndexes;
}

@property (readonly) BOOL useDefaultPreamble;
@property (readonly) Preambles *preambles;
@property (retain) NSAttributedString *preambleText;
@property (retain) NSIndexSet *selectionIndexes;

- (id)initWithNibName:(NSString *)nibName plist:(NSString*)plist styles:(NSArray*)sty edges:(NSArray*)edg;
- (void)savePreambles:(NSString*)plist;
- (NSString*)currentPreamble;
- (NSString*)currentPostamble;
- (NSString*)buildDocumentForTikz:(NSString*)tikz;

- (IBAction)setPreambleToDefault:(id)sender;
- (IBAction)setPreamble:(id)sender;
- (IBAction)insertDefaultStyles:(id)sender;

- (IBAction)addPreamble:(id)sender;
- (IBAction)duplicatePreamble:(id)sender;

@end
