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
    NSDictionary *nodeStyles;
    NSMutableArray* customNodeStyles;
    
	GraphicsView *__weak graphicsView;
	TikzSourceController *__weak tikzSourceController;
    NSTableView *customNodeTable;
}

@property NSDictionary *nodeStyles;
@property NSMutableArray* customNodeStyles;

@property IBOutlet NSTableView *customNodeTable;

@property (weak) IBOutlet GraphicsView *graphicsView;
@property (weak) IBOutlet TikzSourceController *tikzSourceController;

@end
