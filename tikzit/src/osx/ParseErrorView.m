//
//  ParseErrorView.m
//  TikZiT
//
//  Created by Karl Johan Paulsson on 27/01/2013.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import "ParseErrorView.h"

@implementation ParseErrorView

- (id)initWithFrame:(NSRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code here.
    }
    
    return self;
}

- (void)drawRect:(NSRect)dirtyRect
{
    // Drawing code here.
}

- (void)awakeFromNib{
    self.layer = [CALayer layer];
    self.wantsLayer = YES;
    CALayer *newLayer = [CALayer layer];
    self.layer.backgroundColor = [[NSColor controlColor] CGColor];
    //CGColorCreate(CGColorSpaceCreateDeviceRGB(), (CGFloat[]){ 1, .9, .64, 1 });
//    newLayer.backgroundColor = [NSColor redColor].CGColor;
    newLayer.frame = NSMakeRect(100,100,100,100);//NSMakeRect(0,0,image.size.width,image.size.height);
    newLayer.position  = CGPointMake(20,20);
    //[self.layer addSublayer:newLayer];
}

@end
