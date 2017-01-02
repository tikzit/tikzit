//
//  GraphElementData.m
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

#import "GraphElementData.h"
#import "GraphElementProperty.h"


@implementation GraphElementData

+ (id)data {
#if __has_feature(objc_arc)
    return [[self alloc] init];
#else
	return [[[self alloc] init] autorelease];
#endif
}

- (id)init {
	self = [super init];
	if (self) {
		properties = [[NSMutableArray alloc] init];
	}
	return self;
}

// all of the array messages delegate to 'properties'

- (NSUInteger)count { return [properties count]; }
- (id)objectAtIndex:(NSUInteger)index {
	return [properties objectAtIndex:index];
}
- (NSArray*)objectsAtIndexes:(NSIndexSet*)indexes {
	return [properties objectsAtIndexes:indexes];
}

#if __has_feature(objc_arc)
- (void) getObjects:(__unsafe_unretained id*)buffer range:(NSRange)range {
#else
- (void) getObjects:(id*)buffer range:(NSRange)range {
#endif
	[properties getObjects:buffer range:range];
}

- (void)insertObject:(id)anObject atIndex:(NSUInteger)index {
	[properties insertObject:anObject atIndex:index];
}
- (void)removeObjectAtIndex:(NSUInteger)index {
	[properties removeObjectAtIndex:index];
}
- (void)addObject:(id)anObject {
	[properties addObject:anObject];
}
- (void)removeLastObject {
	[properties removeLastObject];
}
- (void)replaceObjectAtIndex:(NSUInteger)index withObject:(id)anObject {
	[properties replaceObjectAtIndex:index withObject:anObject];
}
    
#if __has_feature(objc_arc)
- (NSUInteger) countByEnumeratingWithState:(NSFastEnumerationState *)state
                                   objects:(__unsafe_unretained id [])stackbuf
                                     count:(NSUInteger)len {
#else
- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state
								  objects:(id *)stackbuf
									count:(NSUInteger)len {
#endif
    return [properties countByEnumeratingWithState:state objects:stackbuf count:len];
}

- (void)setProperty:(NSString*)val forKey:(NSString*)key {
	GraphElementProperty *m = [[GraphElementProperty alloc] initWithKeyMatching:key];
	NSInteger idx = [properties indexOfObject:m];
#if !__has_feature(objc_arc)
    [m release];
#endif
	
	GraphElementProperty *p;
	if (idx == NSNotFound) {
		p = [[GraphElementProperty alloc] initWithPropertyValue:val forKey:key];
		[properties addObject:p];
#if !__has_feature(objc_arc)
        [p release];
#endif
	} else {
		p = [properties objectAtIndex:idx];
		[p setValue:val];
	}
}

- (void)unsetProperty:(NSString*)key {
	GraphElementProperty *m = [[GraphElementProperty alloc] initWithKeyMatching:key];
	[properties removeObject:m];
#if !__has_feature(objc_arc)
    [m release];
#endif

}

- (NSString*)propertyForKey:(NSString*)key {
	GraphElementProperty *m = [[GraphElementProperty alloc] initWithKeyMatching:key];
	NSInteger idx = [properties indexOfObject:m];
#if !__has_feature(objc_arc)
    [m release];
#endif

	
	if (idx == NSNotFound) {
		return nil;
	}else {
		GraphElementProperty *p = [properties objectAtIndex:idx];
		return [p value];
	}
}

- (void)setAtom:(NSString*)atom {
	GraphElementProperty *a = [[GraphElementProperty alloc] initWithAtomName:atom];
	if (![properties containsObject:a]) [properties addObject:a];
#if !__has_feature(objc_arc)
    [a release];
#endif
}

- (void)unsetAtom:(NSString*)atom {
	GraphElementProperty *a = [[GraphElementProperty alloc] initWithAtomName:atom];
	[properties removeObject:a];
#if !__has_feature(objc_arc)
    [a release];
#endif
}

- (BOOL)isAtomSet:(NSString*)atom {
	GraphElementProperty *a = [[GraphElementProperty alloc] initWithAtomName:atom];
	BOOL set = [properties containsObject:a];
#if !__has_feature(objc_arc)
    [a release];
#endif
	return set;
}

- (NSString*)tikzList {
	NSString *s = [properties componentsJoinedByString:@", "];
	return ([s isEqualToString:@""]) ? @"" : [NSString stringWithFormat:@"[%@]", s];
}

- (id)copyWithZone:(NSZone *)zone {
	GraphElementData *cp = [[GraphElementData allocWithZone:zone] init];
	for (GraphElementProperty *p in properties) {
		GraphElementProperty *p2 = [p copy];
		[cp addObject:p2];
#if !__has_feature(objc_arc)
        [p2 release];
#endif
	}
	return cp;
}

- (void)dealloc {
#if !__has_feature(objc_arc)
    [properties release];
    [super dealloc];
#endif
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
