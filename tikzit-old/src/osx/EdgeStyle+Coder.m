//
//  EdgeStyle+Coder.m
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

#import "EdgeStyle+Coder.h"

@implementation EdgeStyle (Coder)

- (id)initWithCoder:(NSCoder*)coder {
	if (!(self = [super init])) return nil;
	
    name = [coder decodeObjectForKey:@"name"];
    category = [coder decodeObjectForKey:@"category"];
	headStyle = [coder decodeIntForKey:@"headStyle"];
	tailStyle = [coder decodeIntForKey:@"tailStyle"];
    decorationStyle = [coder decodeIntForKey:@"decorationStyle"];
    thickness = [coder decodeFloatForKey:@"thickness"];
    
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
    [coder encodeObject:name forKey:@"name"];
    [coder encodeObject:category forKey:@"category"];
	[coder encodeInt:headStyle forKey:@"headStyle"];
    [coder encodeInt:tailStyle forKey:@"tailStyle"];
    [coder encodeInt:decorationStyle forKey:@"decorationStyle"];
    [coder encodeFloat:thickness forKey:@"thickness"];
}

@end
