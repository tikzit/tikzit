//
//
//  GraphElementProperty.m
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

#import "GraphElementProperty.h"
#import "NSString+Tikz.h"

@implementation GraphElementProperty

+ (id)atom:(NSString*)n {
#if __has_feature(objc_arc)
    return [[self alloc] initWithAtomName:n];
#else
    return [[[self alloc] initWithAtomName:n] autorelease];
#endif
}
+ (id)property:(NSString*)k withValue:(NSString*)v {
#if __has_feature(objc_arc)
    return [[self alloc] initWithPropertyValue:v forKey:k];
#else
	return [[[self alloc] initWithPropertyValue:v forKey:k] autorelease];
#endif
}
+ (id)keyMatching:(NSString*)k {
#if __has_feature(objc_arc)
    return [[self alloc] initWithKeyMatching:k];
#else
	return [[[self alloc] initWithKeyMatching:k] autorelease];
#endif
}

- (id)initWithAtomName:(NSString*)n {
	self = [super init];
	if (self) {
		[self setKey:n];
		isAtom = YES;
	}
	return self;
}

- (id)initWithPropertyValue:(NSString*)v forKey:(NSString*)k {
	self = [super init];
	if (self) {
		[self setKey:k];
		[self setValue:v];
	}
	return self;
}

- (id)initWithKeyMatching:(NSString*)k {
	self = [super init];
	if (self) {
		[self setKey:k];
		isKeyMatch = YES;
	}
	return self;
}

- (void) dealloc {
#if ! __has_feature(objc_arc)
	[key release];
	[value release];
	[super dealloc];
#endif
}

- (void)setValue:(NSString *)v {
	if (value != v) {
#if ! __has_feature(objc_arc)
		[value release];
#endif
		value = [v copy];
	}
}

- (NSString*)value {
	if (isAtom) {
		return @"(atom)";
	} else {
		return value;
	}
}


- (void)setKey:(NSString *)k {
	if (key != k) {
#if ! __has_feature(objc_arc)
		[key release];
#endif
		key = [k copy];
	}
    if (key == nil)
		key = @""; // don't allow nil keys
}

- (NSString*)key {
    return key;
}

- (BOOL)isAtom { return isAtom; }
- (BOOL)isKeyMatch { return isKeyMatch; }

- (BOOL)matches:(GraphElementProperty*)object {
	// properties and atoms are taken to be incomparable
	if ([self isAtom] != [object isAtom]) return NO;
	
	// only compare keys if (a) we are both atoms, (b) i am a key match, or (c) object is a key match
	if (([self isAtom] && [object isAtom]) || [self isKeyMatch] || [object isKeyMatch]) {
		return [[self key] isEqual:[object key]];
	}
	
	// otherwise compare key and value
	return [[self key] isEqual:[object key]] && [[self value] isEqual:[object value]];
}

- (BOOL)isEqual:(id)object {
	return [self matches:object];
}

- (id)copyWithZone:(NSZone*)zone {
	if (isAtom) {
		return [[GraphElementProperty allocWithZone:zone] initWithAtomName:[self key]];
	} else if (isKeyMatch) {
		return [[GraphElementProperty allocWithZone:zone] initWithKeyMatching:[self key]];
	} else {
		return [[GraphElementProperty allocWithZone:zone] initWithPropertyValue:[self value] forKey:[self key]];
	}
}

- (NSString*)description {
	if ([self isAtom]) {
		return [[self key] tikzEscapedString];
	} else if ([self isKeyMatch]) {
		return [NSString stringWithFormat:@"%@=*", [[self key] tikzEscapedString]];
	} else {
		return [NSString stringWithFormat:@"%@=%@",
			   [[self key] tikzEscapedString],
			   [[self value] tikzEscapedString]];
	}
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
