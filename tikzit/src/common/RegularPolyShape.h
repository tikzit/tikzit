//
//  RegularPolyShape.h
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
#import "Shape.h"

/**
 * A regular polygon
 *
 * Matches the "regular polygon" shape in the shapes.geometric
 * PGF/TikZ library.
 */
@interface RegularPolyShape : Shape {
}

/**
 * Initialise a regular polygon
 *
 * A rotation of 0 will produce a polygon with one
 * edge flat along the bottom (just like PGF/TikZ
 * does it).
 *
 * @param sides     the number of sides the polygon should have
 * @param rotation  the rotation of the polygon, in degrees
 */
- (id)initWithSides:(int)sides rotation:(int)rotation;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
