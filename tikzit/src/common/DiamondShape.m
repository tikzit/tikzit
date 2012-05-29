//
//  DiamondShape.m
//  TikZiT
//
//  Copyright 2011 Aleks Kissinger
//  Copyright 2012 Alex Merry
//  All rights reserved.
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

#import "DiamondShape.h"

#import "Node.h"
#import "Edge.h"

@implementation DiamondShape

- (id)init {
	self = [super init];

	if (!self)
		return nil;

	Node *n0,*n1,*n2,*n3;
	float sz = 0.25f;
	
	n0 = [Node nodeWithPoint:NSMakePoint(0, sz)];
	n1 = [Node nodeWithPoint:NSMakePoint(sz, 0)];
	n2 = [Node nodeWithPoint:NSMakePoint(0,-sz)];
	n3 = [Node nodeWithPoint:NSMakePoint(-sz,0)];
	
	Edge *e0,*e1,*e2,*e3;
	
	e0 = [Edge edgeWithSource:n0 andTarget:n1];
	e1 = [Edge edgeWithSource:n1 andTarget:n2];
	e2 = [Edge edgeWithSource:n2 andTarget:n3];
	e3 = [Edge edgeWithSource:n3 andTarget:n0];
	
	paths = [[NSSet alloc] initWithObjects:[NSArray arrayWithObjects:e0,e1,e2,e3,nil],nil];

	styleTikz = @"shape=diamond";
	
	return self;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
