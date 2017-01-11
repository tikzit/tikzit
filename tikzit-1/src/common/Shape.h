//
//  Shape.h
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

#import <Foundation/Foundation.h>
#import "Transformer.h"

@interface Shape : NSObject <NSCopying> {
	NSSet    *paths;
	NSRect    boundingRect; // cache
	NSString *styleTikz;
}

@property (retain)   NSSet    *paths;
@property (readonly) NSRect    boundingRect;
/**
 * The tikz code to use in style properties for this shape
 *
 * This can return nil, in which case the shape name should be used
 */
@property (retain)   NSString *styleTikz;

- (id)init;
+ (void)refreshShapeDictionary;
+ (NSDictionary*)shapeDictionary;
+ (Shape*)shapeForName:(NSString*)shapeName;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
