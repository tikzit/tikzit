//
//  MultiCombo.h
//  TikZiT
//
//  Created by Aleks Kissinger on 21/04/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>


@interface MultiCombo : NSComboBox {
	BOOL multi;
}

@property (readwrite,assign) BOOL multi;

@end
