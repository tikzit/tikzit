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
	return [[[self alloc] initWithAtomName:n] autorelease];
}
+ (id)property:(NSString*)k withValue:(NSString*)v {
	return [[[self alloc] initWithPropertyValue:v forKey:k] autorelease];
}
+ (id)keyMatching:(NSString*)k {
	return [[[self alloc] initWithKeyMatching:k] autorelease];
}

- (id)initWithAtomName:(NSString*)n {
	self = [super init];
	if (self) {
		[self setKey:n];
		[self setValue:nil];
		isAtom = YES;
		isKeyMatch = NO;
	}
	return self;
}

- (id)initWithPropertyValue:(NSString*)v forKey:(NSString*)k {
	self = [super init];
	if (self) {
		[self setKey:k];
		[self setValue:v];
		isAtom = NO;
		isKeyMatch = NO;
	}
	return self;
}

- (id)initWithKeyMatching:(NSString*)k {
	self = [super init];
	if (self) {
		[self setKey:k];
		[self setValue:nil];
		isAtom = NO;
		isKeyMatch = YES;
	}
	return self;
}

- (void)setValue:(NSString *)v {
	if (value != v) {
		[value release];
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
    if (k == nil) k = @""; // don't allow nil keys
	if (key != k) {
		[key release];
		key = [k retain];
	}
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
