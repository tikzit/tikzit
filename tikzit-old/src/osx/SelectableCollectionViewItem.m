//
//  SelectableCollectionViewItem.m
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

#import "SelectableCollectionViewItem.h"
#import "SelectableNodeView.h"

@implementation SelectableCollectionViewItem

- (id)copyWithZone:(NSZone *)zone {
	SelectableCollectionViewItem *item = [super copyWithZone:zone];
	[item setStylePaletteController:stylePaletteController];
	return (id)item;
}

- (void)setSelected:(BOOL)flag {
	[super setSelected:flag];
	[(SelectableNodeView*)[self view] setSelected:flag];
	
	// only fire this event from the view that lost selection
	//if (flag == NO) [stylePaletteController selectionDidChange];
	
	[[self view] setNeedsDisplay:YES];
}

- (void)setRepresentedObject:(id)object {
	[super setRepresentedObject:object];
	[(SelectableNodeView*)[self view] setNodeStyle:(NodeStyle*)object];
}

- (void)setStylePaletteController:(StylePaletteController*)spc {
	stylePaletteController = spc;
}

@end
