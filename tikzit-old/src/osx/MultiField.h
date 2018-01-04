//
//  LabelField.h
//  TikZiT
//
//  Created by Aleks Kissinger on 20/04/2011.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>


@interface MultiField : NSTextField {
	BOOL multi;
}

@property (readwrite,assign) BOOL multi;

@end
