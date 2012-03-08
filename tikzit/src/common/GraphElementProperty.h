//
//  GraphElementProperty.h
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

#import <Foundation/Foundation.h>

/*!
 @class GraphElementProperty
 @brief A property. I.e. a single entry in a node's/edge's/graph's 
        GraphElementData table.
 */
@interface GraphElementProperty : NSObject<NSCopying> {
	NSString *key;
	NSString *value;
	BOOL isAtom;
	BOOL isKeyMatch;
}

@property (readwrite,retain) NSString *key;
@property (readwrite,retain) NSString *value;
@property (readonly) BOOL isAtom;
@property (readonly) BOOL isKeyMatch;

/*!
 @brief      Initialize a new key-matching object.
 @param      k a key to match
 @result     A key-matching object.
 */
- (id)initWithKeyMatching:(NSString*)k;

/*!
 @brief      Initialize a new atomic property.
 @param      n the atom's name
 @result     An atom.
 */
- (id)initWithAtomName:(NSString*)n;

/*!
 @brief      Initialize a new property.
 @param      v the property's value
 @param      k the associated key
 @result     A property.
 */
- (id)initWithPropertyValue:(NSString*)v forKey:(NSString*)k;

/*!
 @brief      A matching function for properties.
 @details    Two properties match iff their keys match and one of the following:
             (a) they are both atomic, (b) one is a key-matching and one is a non-atomic
             property, or (c) they are both non-atomic and their values match.
 @param      object another GraphElementProperty
 @result     A boolean.
 */
- (BOOL)matches:(GraphElementProperty*)object;

/*!
 @brief      An alias for <tt>matches:</tt>. This allows one to use built-in methods that
             filter on <tt>isEqual:</tt> for <tt>NSObject</tt>s.
 @param      object another GraphElementProperty
 @result     A boolean.
 */
- (BOOL)isEqual:(id)object;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
