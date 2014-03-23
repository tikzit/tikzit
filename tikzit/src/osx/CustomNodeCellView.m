//
//  CustomNodeCellView.m
//  TikZiT
//
//  Created by Johan Paulsson on 12/12/13.
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
//

#import "CustomNodeCellView.h"

@implementation CustomNodeCellView

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
	[super drawRect:dirtyRect];
	
    // Drawing code here.
}

- (id) objectValue{
    return [super objectValue];
}

-(void)drawLayer:(CALayer *)layer inContext:(CGContextRef)context {
    NSLog(@"drawing layer ^^");
    
    if (nodeLayer!=nil) {
		if (![[[self layer] sublayers] containsObject:nodeLayer]) {
			[[self layer] addSublayer:nodeLayer];
			NSPoint c = NSMakePoint((CGRectGetMinX([[self layer] frame])+CGRectGetWidth([nodeLayer bounds])/2),
									CGRectGetMidY([[self layer] frame]));
            //c = NSMakePoint(-16.5,-16.5);
			[nodeLayer setCenter:c andAnimateWhen:NO];
            [[self textField] setFrame:NSMakeRect(CGRectGetWidth([nodeLayer bounds]), CGRectGetMidY([[self layer] frame]), CGRectGetWidth([[self textField] frame]), CGRectGetHeight([[self textField] frame]))];
		}
		
		if (selected){
            [nodeStyle setStrokeColor:[NSColor whiteColor]];
            [[nodeLayer node] setStyle:nodeStyle];
        }else{
            [nodeStyle setStrokeColor:[NSColor blackColor]];
            [[nodeLayer node] setStyle:nodeStyle];
		}
        
		[nodeLayer updateFrame];
	}
}

- (void) setObjectValue:(id)objectValue{
    [[self textField] setStringValue:[(NodeStyle *)objectValue shapeName]];
    nodeStyle = (NodeStyle *)objectValue;
    
	if (nodeLayer == nil) {
		nodeLayer = [[NodeLayer alloc] initWithNode:[Node node]
										transformer:[Transformer defaultTransformer]];
		[nodeLayer setRescale:NO];
	}
	
	[[nodeLayer node] setStyle:nodeStyle];
	[nodeLayer updateFrame];
}

- (void)setBackgroundStyle:(NSBackgroundStyle)backgroundStyle {
    [super setBackgroundStyle:backgroundStyle];
    
    selected = (backgroundStyle == NSBackgroundStyleDark);
    [self setNeedsDisplay:YES];
}

@end
