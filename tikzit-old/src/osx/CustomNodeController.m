//
//  CustomNodeController.m
//  TikZiT
//
//  Created by Johan Paulsson on 12/4/13.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import "CustomNodeController.h"
#import "NodeStyle.h"

@interface CustomNodeController ()

@end

@implementation CustomNodeController

@synthesize nodeStyles, customNodeStyles;
@synthesize graphicsView, tikzSourceController;
@synthesize customNodeTable;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
        nodeStyles = [Shape shapeDictionary];
        customNodeStyles = [NSMutableArray array];
        
        for(id key in nodeStyles) {
            Shape *value = [nodeStyles objectForKey:key];
            
            if([value isKindOfClass:[TikzShape class]]){
                NodeStyle *newNodeStyle = [[NodeStyle alloc] init];
                [newNodeStyle setShapeName:key];
                
                [customNodeStyles addObject:newNodeStyle];
            }
        }
    }
    
    return self;
}

- (void)tableViewSelectionDidChange:(NSNotification *)aNotification{
    NSInteger selectedRow = [customNodeTable selectedRow];
    
    NodeStyle* selectedNodeStyle = [customNodeStyles objectAtIndex:selectedRow];
    TikzShape *tikzshape = (TikzShape *) [nodeStyles objectForKey:[selectedNodeStyle shapeName]];
    
    [[tikzSourceController graphicsView] setEnabled:NO];
    [tikzSourceController setTikz:[tikzshape tikzSrc]];
    [tikzSourceController parseTikz:self];
}

- (id)valueForUndefinedKey:(NSString *)key{
    return nil;
}

@end
