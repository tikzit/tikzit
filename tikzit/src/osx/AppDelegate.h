//
//  AppDelegate.h
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
#import "StylePaletteController.h"
#import "ToolPaletteController.h"
#import "PropertyInspectorController.h"
#import "PreambleController.h"
#import "PreviewController.h"
#import "GraphicsView.h"
#import "PreferenceController.h";

@interface AppDelegate : NSObject {
	NSMapTable *table;
	StylePaletteController *stylePaletteController;
	PropertyInspectorController *propertyInspectorController;
	PreambleController *preambleController;
	PreviewController *previewController;
	PreferenceController *preferenceController;
	ToolPaletteController *toolPaletteController;
	IBOutlet GraphicsView *graphicsView;
	NSString *tempDir;
}

@property IBOutlet StylePaletteController *stylePaletteController;
@property IBOutlet ToolPaletteController *toolPaletteController;

- (void)awakeFromNib;
+ (void)setDefaults;
- (void)applicationWillTerminate:(NSNotification *)notification;
- (IBAction)toggleStyleInspector:(id)sender;
- (IBAction)togglePropertyInspector:(id)sender;
- (IBAction)togglePreamble:(id)sender;
- (IBAction)togglePreferences:(id)sender;
- (IBAction)refreshShapes:(id)sender;

@end
