//
//  ToolPaletteController.m
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

#import "ToolPaletteController.h"


@implementation ToolPaletteController

@synthesize toolPalette, toolMatrix;

- (TikzTool)selectedTool {
	switch (toolMatrix.selectedRow) {
		case 0: return TikzToolSelect;
		case 1: return TikzToolNode;
		case 2: return TikzToolEdge;
		case 3: return TikzToolCrop;
	}
	return TikzToolSelect;
}

- (void)setSelectedTool:(TikzTool)tool {
	switch (tool) {
		case TikzToolSelect:
			[toolMatrix selectCellAtRow:0 column:0];
			break;
		case TikzToolNode:
			[toolMatrix selectCellAtRow:1 column:0];
			break;
		case TikzToolEdge:
			[toolMatrix selectCellAtRow:2 column:0];
			break;
		case TikzToolCrop:
			[toolMatrix selectCellAtRow:3 column:0];
			break;
	}
}

@end
