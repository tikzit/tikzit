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
    NSDictionary* __weak nodeStyles;
    NSMutableArray* customNodeStyles;
    NSMutableArray* __weak onodeStyles;
    
	GraphicsView *__weak graphicsView;
	TikzSourceController *__weak tikzSourceController;
}

@property (weak, readonly) NSDictionary *nodeStyles;
@property (weak, readonly) NSMutableArray* onodeStyles;

@property (weak) IBOutlet GraphicsView *graphicsView;
@property (weak) IBOutlet TikzSourceController *tikzSourceController;

@end
