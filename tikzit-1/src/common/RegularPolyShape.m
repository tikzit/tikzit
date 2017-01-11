//
//  RegularPolyShape.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger
//  Copyright 2012 Alex Merry
//  All rights reserved.
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

#import "RegularPolyShape.h"
#import "Node.h"
#import "Edge.h"
#import "util.h"

@implementation RegularPolyShape

- (id)initWithSides:(int)sides rotation:(int)rotation {
	self = [super init];
	if (self == nil)
		return nil;

	// TikZ draws regular polygons using a radius inscribed
	// _inside_ the shape (touching middles of edges), not
	// outside (touching points)
	const float innerRadius = 0.2f;

	NSMutableArray *nodes = [NSMutableArray arrayWithCapacity:sides];
	NSMutableArray *edges = [NSMutableArray arrayWithCapacity:sides];

	float dtheta = (M_PI * 2.0f) / ((float)sides);
	float theta = (dtheta/2.0f) - (M_PI / 2.0f);
	theta += degreesToRadians(rotation);
	// radius of the outer circle
	float radius = ABS(innerRadius / cos(dtheta));

	for (int i = 0; i < sides; ++i) {
		NSPoint p;
		p.x = radius * cos(theta);
		p.y = radius * sin(theta);
		
		[nodes addObject:[Node nodeWithPoint:p]];
		theta += dtheta;
	}

	for (int i = 0; i < sides; ++i) {
		[edges addObject:[Edge edgeWithSource:[nodes objectAtIndex:i]
									andTarget:[nodes objectAtIndex:(i+1)%sides]]];
	}

	paths = [[NSSet alloc] initWithObjects:edges,nil];

	styleTikz = [[NSString alloc] initWithFormat:
		@"regular polygon,regular polygon sides=%d,shape border rotate=%d",
		sides, rotation];

	return self;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
