//
//  PreferenceController.h
//  TikZiT
//
//  Created by Karl Johan Paulsson on 26/02/2013.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface PreferenceController : NSWindowController{
    
    IBOutlet NSView *engineView;
    IBOutlet NSView *generalView;
    
    int currentViewTag;
}

- (IBAction)switchView:(id)sender;

@end
