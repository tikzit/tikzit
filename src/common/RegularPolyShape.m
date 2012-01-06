//
//  RegularPolyShape.m
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

#import "RegularPolyShape.h"
#import "Node.h"
#import "Edge.h"

@implementation RegularPolyShape

- (id)initWithSides:(int)sides rotation:(float)rotation {
	[super init];
	
	float rad = 0.25f;
	
	NSMutableArray *nodes = [NSMutableArray arrayWithCapacity:sides];
	NSMutableArray *edges = [NSMutableArray arrayWithCapacity:sides];
	
	float dtheta = (M_PI * 2.0f) / ((float)sides);
	float theta = rotation;
	int i;
	float maxY=0.0f, minY=0.0f;
	NSPoint p;
	for (i = 0; i < sides; ++i) {
		p.x = rad * cos(theta);
		p.y = rad * sin(theta);
		if (p.y<minY) minY = p.y;
		if (p.y>maxY) maxY = p.y;
		
		[nodes addObject:[Node nodeWithPoint:p]];
		theta += dtheta;
	}
	
	float dy = (minY + maxY) / 2.0f;
	
	for (i = 0; i < sides; ++i) {
		p = [[nodes objectAtIndex:i] point];
		p.y -= dy;
		[[nodes objectAtIndex:i] setPoint:p];
		[edges addObject:[Edge edgeWithSource:[nodes objectAtIndex:i]
									andTarget:[nodes objectAtIndex:(i+1)%sides]]];
	}
	
	paths = [[NSSet alloc] initWithObjects:edges,nil];
	return self;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
