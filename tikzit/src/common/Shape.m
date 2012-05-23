//
//  Shape.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger. All rights reserved.
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

#import "Shape.h"

#import "Edge.h"
#import "SupportDir.h"
#import "ShapeNames.h"

#import "CircleShape.h"
#import "DiamondShape.h"
#import "RectangleShape.h"
#import "RegularPolyShape.h"
#import "TikzShape.h"

#import "util.h"

@implementation Shape

- (void)calcBoundingRect {
	boundingRect = NSZeroRect;

	if (paths == nil)
		return;

	for (NSArray *arr in paths) {
		for (Edge *e in arr) {
			boundingRect = NSUnionRect(boundingRect, [e boundingRect]);
		}
	}
}

- (id)init {
	[super init];
	paths = nil;
	return self;
}

- (NSSet*)paths {return paths;}
- (void)setPaths:(NSSet *)p {
	if (paths != p) {
		[paths release];
		paths = [p retain];
		[self calcBoundingRect];
	}
}

- (NSRect)boundingRect { return boundingRect; }

@synthesize styleTikz;

- (id)copyWithZone:(NSZone*)zone {
	Shape *cp = [[[self class] allocWithZone:zone] init];
	[cp setPaths:paths];
	[cp setStyleTikz:styleTikz];
	return cp;
}

- (void)dealloc {
	[paths release];
	[styleTikz release];
	[super dealloc];
}

NSDictionary *shapeDictionary = nil;

+ (void)addShapesInDir:(NSString*)shapeDir to:(NSMutableDictionary*)shapeDict {
	NSFileManager *fileManager = [NSFileManager defaultManager];
	NSArray *files = [fileManager directoryContentsAtPath:shapeDir];

	if (files != nil) {
		NSString *nm;
		for (NSString *f in files) {
			if ([f hasSuffix:@".tikz"]) {
				nm = [f substringToIndex:[f length]-5];
				TikzShape *sh =
                  [[TikzShape alloc] initWithTikzFile:
                   [shapeDir stringByAppendingPathComponent:f]];
				if (sh != nil) {
					[shapeDict setObject:sh forKey:nm];
                    [sh release];
				}
			}
		}
	}
}

+ (void)refreshShapeDictionary {
    Shape *shapes[5] = {
        [[CircleShape alloc] init],
        [[RectangleShape alloc] init],
        [[DiamondShape alloc] init],
        [[RegularPolyShape alloc] initWithSides:3 rotation:(M_PI/2.0f)],
        [[RegularPolyShape alloc] initWithSides:3 rotation:(-M_PI/2.0f)]};
	NSMutableDictionary *shapeDict = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
									  shapes[0], SHAPE_CIRCLE,
									  shapes[1], SHAPE_RECTANGLE,
									  shapes[2], SHAPE_DIAMOND,
									  shapes[3], SHAPE_UP_TRIANGLE,
									  shapes[4], SHAPE_DOWN_TRIANGLE,
									  nil];
	for (int i = 0; i<5; ++i) [shapes[i] release];
    
	NSString *systemShapeDir = [[SupportDir systemSupportDir] stringByAppendingPathComponent:@"shapes"];
	NSString *userShapeDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"shapes"];
	
	[Shape addShapesInDir:systemShapeDir to:shapeDict];
	[Shape addShapesInDir:userShapeDir to:shapeDict];
	
	shapeDictionary = shapeDict;

	[[NSNotificationCenter defaultCenter]
		postNotificationName:@"ShapeDictionaryReplaced"
		object:self];
}

+ (NSDictionary*)shapeDictionary {
	if (shapeDictionary == nil) [Shape refreshShapeDictionary];
	return shapeDictionary;
}

+ (Shape*)shapeForName:(NSString*)shapeName {
	Shape *s = [[[Shape shapeDictionary] objectForKey:shapeName] copy];
	return [s autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
