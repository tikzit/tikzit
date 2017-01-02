//
//  NodeLayer.h
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

#import <Cocoa/Cocoa.h>
#import <QuartzCore/CoreAnimation.h>
#import "Transformer.h"
#import "Shape.h"
#import "Node.h"
#import "NodeStyle+Coder.h"
#import "NodeSelectionLayer.h"

@interface NodeLayer : CALayer {
	Node *node;
	Shape *shape;
    CGMutablePathRef path;
	float textwidth;
	NSPoint center;
	Transformer *transformer;
	Transformer *localTrans;
	NodeSelectionLayer *selection;
	BOOL rescale;
    BOOL dirty; // need to rebuild CGBezierPath of the shape
}

@property (strong) Node *node;
@property (assign) NSPoint center;
@property (assign) BOOL rescale;
@property (strong) NodeSelectionLayer *selection;
@property (readonly) CGMutablePathRef path;

- (id)initWithNode:(Node*)n transformer:(Transformer*)t;
- (NSColor*)strokeColor;
- (NSColor*)fillColor;
- (float)strokeWidth;

- (void)setCenter:(NSPoint)ctr andAnimateWhen:(BOOL)anim;
- (void)updateFrame;
- (BOOL)nodeContainsPoint:(NSPoint)p;

- (void)drawInContext:(CGContextRef)context;

@end
