//
//  Preambles+Coder.m
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

#import "Preambles+Coder.h"


@implementation Preambles (Coder)

- (id)initWithCoder:(NSCoder *)coder {
	if (!(self = [super init])) return nil;
	selectedPreambleName = [coder decodeObjectForKey:@"selectedPreamble"];
	preambleDict = [coder decodeObjectForKey:@"preambles"];
	return self;
}

- (void)encodeWithCoder:(NSCoder *)coder {
	[coder encodeObject:selectedPreambleName forKey:@"selectedPreamble"];
	[coder encodeObject:preambleDict forKey:@"preambles"];
}

@end
