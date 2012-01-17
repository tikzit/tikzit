//
//  Node.m
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

#import "Node.h"

#import "Shape.h"


@implementation Node

- (id)initWithPoint:(NSPoint)p {
	[super init];
	data = [[GraphElementData alloc] init];
	style = nil;
	label = @"";
	point = p;
	//[self updateData];
	return self;
}

- (id)init {
	[self initWithPoint:NSMakePoint(0.0f, 0.0f)];
	return self;
}

- (Shape*) shape {
    if (style) {
        return [Shape shapeForName:[style shapeName]];
    } else {
        return nil;
    }
}

- (Transformer*) shapeTransformerFromTransformer:(Transformer*)t {
	// we take a copy to keep the reflection attributes
    Transformer *transformer = [[t copy] autorelease];
    NSPoint screenPos = [t toScreen:point];
    [transformer setOrigin:screenPos];
    float scale = [t scale];
    if (style) {
        scale *= [style scale];
    }
    [transformer setScale:scale];
    return transformer;
}

- (Transformer*) shapeTransformer {
    float scale = 1.0f;
    if (style) {
        scale = [style scale];
	}
    return [Transformer transformerWithOrigin:point andScale:scale];
}

- (NSRect) boundsUsingShapeTransform:(Transformer*)shapeTrans {
	//if (style) {
		return [shapeTrans rectToScreen:[[self shape] boundingRect]];
	/*} else {
		NSRect r = NSZeroRect;
		r.origin = [shapeTrans toScreen:[self point]];
		return r;
	}*/
}

- (NSRect) boundingRect {
	return [self boundsUsingShapeTransform:[self shapeTransformer]];
}

- (BOOL)attachStyleFromTable:(NSArray*)styles {
	NSString *style_name = [[[data propertyForKey:@"style"] retain] autorelease];
	
	[self setStyle:nil];
	
	// 'none' is a reserved style
	if (style_name == nil || [style_name isEqualToString:@"none"]) return YES;
	
	for (NodeStyle *s in styles) {
		if ([[s name] compare:style_name]==NSOrderedSame) {
			[self setStyle:s];
			return YES;
		}
	}
	
	// if we didn't find a style, fill in a default one
	[self setStyle:[NodeStyle defaultNodeStyleWithName:style_name]];
	return NO;
}

- (void)updateData {
	if (style == nil) {
		[data setProperty:@"none" forKey:@"style"];
	} else {
		[data setProperty:[style name] forKey:@"style"];
	}
}

- (void)setPropertiesFromNode:(Node*)nd {
	[self setPoint:[nd point]];
	[self setStyle:[nd style]];
	[self setName:[nd name]];
	[self setData:[nd data]];
	[self setLabel:[nd label]];
}

- (id)copy {
	Node *cp = [[Node alloc] init];
	[cp setPropertiesFromNode:self];
	return cp;
}

+ (Node*)nodeWithPoint:(NSPoint)p {
	return [[[Node alloc] initWithPoint:p] autorelease];
}

+ (Node*)node {
	return [[[Node alloc] init] autorelease];
}


// perform a lexicographic ordering (-y, x) on coordinates.
- (NSComparisonResult)compareTo:(id)nd {
	Node *node = (Node*)nd;
	if (point.y > [node point].y) return NSOrderedAscending;
	else if (point.y < [node point].y) return NSOrderedDescending;
	else {
		if (point.x < [node point].x) return NSOrderedAscending;
		else if (point.x > [node point].x) return NSOrderedDescending;
		else return NSOrderedSame;
	}
}


- (NSString*)name {
	return name;
}

- (void)setName:(NSString *)s {
	if (name != s) {
		[name release];
		name = [s copy];
	}
}

- (NSString*)label {
	return label;
}

- (void)setLabel:(NSString *)s {
	if (label != s) {
		[label release];
		label = [s copy];
	}
}

- (GraphElementData*)data {
	return data;
}

- (void)setData:(GraphElementData*)dt {
	if (data != dt) {
		[data release];
		data = [dt copy];
	}
}

- (NSPoint)point {
    return point;
}

- (void)setPoint:(NSPoint)value {
	point = value;
}

- (NodeStyle*)style {
	return style;
}

- (void)setStyle:(NodeStyle *)st {
	NodeStyle *oldStyle = style;
	style = [st retain];
	[oldStyle release];
	[self updateData];
}

- (void)dealloc {
	[self setName:nil];
	[self setStyle:nil];
	[self setData:nil];
	[super dealloc];
}

- (id)copyWithZone:(NSZone*)z {
	return nil;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
