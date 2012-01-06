//
//  BasicMapTable.m
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

#import "BasicMapTable.h"

@implementation BasicMapTable

- (id)init {
	[super init];
	
	mapTable = [[NSMapTable alloc] initWithKeyOptions:NSMapTableStrongMemory
										 valueOptions:NSMapTableStrongMemory
											 capacity:10];
	
	return self;
}

+ (BasicMapTable*)mapTable {
	return [[[BasicMapTable alloc] init] autorelease];
}

- (id)objectForKey:(id)aKey {
	return [mapTable objectForKey:aKey];
}

- (void)setObject:(id)anObject forKey:(id)aKey {
	[mapTable setObject:anObject forKey:aKey];
}

- (NSEnumerator*)objectEnumerator {
	return [mapTable objectEnumerator];
}

- (NSEnumerator*)keyEnumerator {
	return [mapTable keyEnumerator];
}

- (void)dealloc {
	[mapTable release];
	[super dealloc];
}

- (NSUInteger)count {
	return [mapTable count];
}

- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state
								  objects:(id *)stackbuf
									count:(NSUInteger)len {
	return [mapTable countByEnumeratingWithState:state objects:stackbuf count:len];
}

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
