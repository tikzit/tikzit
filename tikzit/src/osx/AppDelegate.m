//
//  AppDelegate.m
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

#import "AppDelegate.h"
#import "TikzGraphAssembler.h"
#import "TikzDocument.h"
#import "Shape.h"
#import "SupportDir.h"

@implementation AppDelegate

@synthesize stylePaletteController, toolPaletteController;

+(void)initialize{
    [self setDefaults];
}

- (void)awakeFromNib {
	[TikzGraphAssembler setup]; // initialise lex/yacc parser globals
	
	[SupportDir createUserSupportDir];
	NSString *supportDir = [SupportDir userSupportDir];
	//NSLog(stylePlist);
	stylePaletteController =
	[[StylePaletteController alloc] initWithWindowNibName:@"StylePalette" 
                                               supportDir:supportDir];
	
	propertyInspectorController =
	[[PropertyInspectorController alloc] initWithWindowNibName:@"PropertyInspector"];
	
	[propertyInspectorController setStylePaletteController:stylePaletteController];
	
	NSString *preamblePlist = [supportDir stringByAppendingPathComponent:@"preambles.plist"];
	preambleController =
	[[PreambleController alloc] initWithWindowNibName:@"Preamble"
												plist:preamblePlist
											   styles:[stylePaletteController nodeStyles]
											    edges:[stylePaletteController edgeStyles]];
    
	
	char template[] = "/tmp/tikzit_tmp_XXXXXXX";
	char *dir = mkdtemp(template);
	tempDir = [NSString stringWithUTF8String:dir];
	
	NSLog(@"created temp dir: %@", tempDir);
	NSLog(@"system support dir: %@", [SupportDir systemSupportDir]);
	
	previewController =
	[[PreviewController alloc] initWithWindowNibName:@"Preview"
								  preambleController:preambleController
											 tempDir:tempDir];
    
    preferenceController = [[PreferenceController alloc] initWithWindowNibName:@"Preferences"];
	
	// each application has one global preview controller
	[PreviewController setDefaultPreviewController:previewController];
}

+ (void)setDefaults{
    NSLog(@"Setting defaults...");
    
    NSString *userDefaultsValuesPath;
    NSDictionary *userDefaultsValuesDict;
    NSDictionary *initialValuesDict;
    NSArray *resettableUserDefaultsKeys;
    
    // load the default values for the user defaults
    userDefaultsValuesPath=[[NSBundle mainBundle] pathForResource:@"UserDefaults"
                                                           ofType:@"plist"];
    userDefaultsValuesDict=[NSDictionary dictionaryWithContentsOfFile:userDefaultsValuesPath];
    
    NSLog(@"Defaults dict: %@",userDefaultsValuesDict);
    
    // set them in the standard user defaults
    [[NSUserDefaults standardUserDefaults] registerDefaults:userDefaultsValuesDict];
    
    // if your application supports resetting a subset of the defaults to
    // factory values, you should set those values
    // in the shared user defaults controller
    //resettableUserDefaultsKeys=[NSArray arrayWithObjects:@"Value1",@"Value2",@"Value3",nil];
    //initialValuesDict=[userDefaultsValuesDict dictionaryWithValuesForKeys:resettableUserDefaultsKeys];
    
    // Set the initial values in the shared user defaults controller
    //[[NSUserDefaultsController sharedUserDefaultsController] setInitialValues:initialValuesDict];
    
    
    NSLog(@"Done with defaults...");
}

- (void)applicationWillTerminate:(NSNotification *)notification {
	NSString *supportDir = [SupportDir userSupportDir];
	[stylePaletteController saveStyles:supportDir];
	[preambleController savePreambles:[supportDir stringByAppendingPathComponent:@"preambles.plist"]];
	
	NSLog(@"wiping temp dir: %@", tempDir);
	[[NSFileManager defaultManager] removeItemAtPath:tempDir error:NULL];
}

- (void)toggleController:(NSWindowController*)c {
	if ([[c window] isVisible]) {
		[c close];
	} else {
		[c showWindow:self];
	}
}

- (IBAction)toggleStyleInspector:(id)sender {
	[self toggleController:stylePaletteController];
}

- (IBAction)togglePropertyInspector:(id)sender {
	[self toggleController:propertyInspectorController];
}

- (IBAction)togglePreamble:(id)sender {
	[self toggleController:preambleController];
}

- (IBAction)togglePreferences:(id)sender {
	[self toggleController:preferenceController];
}

- (IBAction)refreshShapes:(id)sender {
	[Shape refreshShapeDictionary];
}

@end
