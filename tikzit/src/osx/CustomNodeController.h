//
//  CustomNodeController.h
//  TikZiT
//
//  Created by Johan Paulsson on 12/4/13.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import <Cocoa/Cocoa.h>
#import "Shape.h"
#import "TikzShape.h"

#import "GraphicsView.h"
#import "TikzSourceController.h"

#import "SupportDir.h"

@interface CustomNodeController : NSViewController <NSTableViewDelegate>{
    NSDictionary* nodeStyles;
    NSMutableArray* customNodeStyles;
    NSMutableArray* onodeStyles;
    
	GraphicsView *graphicsView;
	TikzSourceController *tikzSourceController;
}

@property (readonly) NSDictionary *nodeStyles;
@property (readonly) NSMutableArray* onodeStyles;

@property IBOutlet GraphicsView *graphicsView;
@property IBOutlet TikzSourceController *tikzSourceController;

@end
