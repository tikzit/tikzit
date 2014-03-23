//
//  CustomNodeCellView.h
//  TikZiT
//
//  Created by Johan Paulsson on 12/12/13.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import <Cocoa/Cocoa.h>

#import "NodeLayer.h"
#import "NodeStyle.h"
#import "NodeStyle+Coder.h"

@interface CustomNodeCellView : NSTableCellView{
    NodeLayer *nodeLayer;
    NodeStyle *nodeStyle;
    BOOL selected;
}

@property (strong) id objectValue;

@end
