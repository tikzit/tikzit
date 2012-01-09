//
//  SelectBoxLayer.h
//  TikZiT
//
//  Created by Aleks Kissinger on 14/06/2010.
//  Copyright 2010 __MyCompanyName__. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import <QuartzCore/CoreAnimation.h>

@interface SelectBoxLayer : CALayer {
	BOOL active;
	CGRect box;
}

@property (assign) BOOL active;
@property (assign) NSRect selectBox;

+ (SelectBoxLayer*)layer;

@end
