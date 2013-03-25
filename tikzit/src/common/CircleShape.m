//
//  CircleShape.m
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

#import "CircleShape.h"
#import "Node.h"
#import "Edge.h"

@implementation CircleShape

- (id)init {
	self = [super init];
	if (self) {
		Node *n0,*n1,*n2,*n3;
		
		n0 = [Node nodeWithPoint:NSMakePoint( 0.0f,  0.2f)];
		n1 = [Node nodeWithPoint:NSMakePoint( 0.2f,  0.0f)];
		n2 = [Node nodeWithPoint:NSMakePoint( 0.0f, -0.2f)];
		n3 = [Node nodeWithPoint:NSMakePoint(-0.2f,  0.0f)];
		
		Edge *e0,*e1,*e2,*e3;
		
		e0 = [Edge edgeWithSource:n0 andTarget:n1]; [e0 setBend:-45];
		e1 = [Edge edgeWithSource:n1 andTarget:n2]; [e1 setBend:-45];
		e2 = [Edge edgeWithSource:n2 andTarget:n3]; [e2 setBend:-45];
		e3 = [Edge edgeWithSource:n3 andTarget:n0]; [e3 setBend:-45];
		
		paths = [[NSSet alloc] initWithObjects:[NSArray arrayWithObjects:e0,e1,e2,e3,nil],nil];

		styleTikz = @"circle";
	}
	return self;
}


@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
