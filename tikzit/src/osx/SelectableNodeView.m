//
//  SelectableView.m
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  

#import "SelectableNodeView.h"
#import "Shape.h"
#import "Transformer.h"

@implementation SelectableNodeView

@synthesize selected;

- (id)initWithFrame:(NSRect)frameRect {
	[super initWithFrame:frameRect];
	nodeLayer = nil;
	return self;
}

-(void)drawLayer:(CALayer *)layer inContext:(CGContextRef)context {
//	NSLog(@"got draw");
//	CGContextSaveGState(context);
//	
//	if (selected) {
//		CGContextSetRGBStrokeColor(context, 0.61f, 0.735f, 1.0f, 1.0f);
//		CGContextSetRGBFillColor(context, 0.61f, 0.735f, 1.0f, 0.5f);
//		CGContextSetLineWidth(context, 1.0f);
//		
//		CGRect box = CGRectMake([layer frame].origin.x + 2,
//								[layer frame].origin.y + 2,
//								[layer frame].size.width - 4,
//								[layer frame].size.height - 4);
//		
//		//CGContextAddRect(context, box);
//		CGContextDrawPath(context, kCGPathFillStroke);
//	}
//	
//	CGContextRestoreGState(context);
	
	if (nodeLayer!=nil) {
		if (![[[self layer] sublayers] containsObject:nodeLayer]) {
			[[self layer] addSublayer:nodeLayer];
			NSPoint c = NSMakePoint(CGRectGetMidX([[self layer] frame]),
									CGRectGetMidY([[self layer] frame]));
			[nodeLayer setCenter:c andAnimateWhen:NO];
		}
		
		if (selected) [[nodeLayer selection] select];
		else [[nodeLayer selection] deselect];
		
		[nodeLayer updateFrame];
	}
}

- (void)drawRect:(NSRect)rect {
	[super drawRect:rect];
}

- (BOOL)acceptsFirstMouse:(NSEvent *)theEvent { return YES; }

- (void)setNodeStyle:(NodeStyle *)sty {
	if (nodeLayer == nil) {
		nodeLayer = [[NodeLayer alloc] initWithNode:[Node node]
										transformer:[Transformer defaultTransformer]];
		[nodeLayer setRescale:NO];
	}
	
	[[nodeLayer node] setStyle:sty];
	[nodeLayer updateFrame];
}

- (NodeStyle*)nodeStyle {
	if (nodeLayer != nil) return [[nodeLayer node] style];
	else return nil;
}


@end
