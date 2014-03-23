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

@synthesize nodeStyles, onodeStyles;
@synthesize graphicsView, tikzSourceController;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    if (self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil]) {
//        [SupportDir createUserSupportDir];
//        NSString *supportDir = [SupportDir userSupportDir];
        
//        NSString *ns = [supportDir stringByAppendingPathComponent:@"nodeStyles.plist"];
//        NSString *es = [supportDir stringByAppendingPathComponent:@"edgeStyles.plist"];
//		onodeStyles = (NSMutableArray*)[NSKeyedUnarchiver
//                                       unarchiveObjectWithFile:ns];
 //       edgeStyles = (NSMutableArray*)[NSKeyedUnarchiver
//                                     unarchiveObjectWithFile:es];
		
        if (onodeStyles == nil) onodeStyles = [NSMutableArray array];
//		if (edgeStyles == nil) edgeStyles = [NSMutableArray array];
        
//		[[self window] setLevel:NSNormalWindowLevel];
//		[self showWindow:self];
	
        // Initialization code here.
        
        NSLog(@"Custom Node controller up and running!");
        
        nodeStyles= [Shape shapeDictionary];

        customNodeStyles = [NSMutableArray array];
        
        NSLog(@"Got a shape dictionary?");
        
        NSString *meh;
        
        for(id key in nodeStyles) {
            Shape *value = [nodeStyles objectForKey:key];
            
            if([value isKindOfClass:[TikzShape class]]){
                NSLog(@"Got a custom node shape!");
                NodeStyle *newNodeStyle = [[NodeStyle alloc] init];
                [newNodeStyle setShapeName:key];
                
                [customNodeStyles addObject:newNodeStyle];
                [onodeStyles addObject:newNodeStyle];
                
//                meh = [(TikzShape *) value tikz];
            }
        }
        
        NSLog(@"Trying to display tikz.");
        
//        [tikzSourceController setTikz:meh];
//        [tikzSourceController parseTikz:self];
    }
    
    return self;
}

-(NSArray *)onodeStyles{
    return onodeStyles;
    //return [nodeStyles allValues];
}

- (void)tableViewSelectionDidChange:(NSNotification *)aNotification{
    NSLog(@"Changed selection!");
}

- (id)valueForUndefinedKey:(NSString *)key{
    return nil;
}

@end
