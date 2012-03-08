//
//  GraphElementData.h
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
 @class      GraphElementData
 @brief      Store extra data associated with a graph, node, or edge.
 @details    Store the extra (style, ...) data associated with
             a graph, node, or edge. This data is stored as a mutable
             array of properties. It also implements hash-like accessors,
             but care should be taken using these, as the list can contain
             multiple occurrences of the same key.
 
             Convention: Getters and setters act on the *first* occurrence
             of the key. 'Unsetters' remove *all* occurrences.
 */
@interface GraphElementData : NSMutableArray {
	NSMutableArray *properties;
}


/*!
 @brief      Set the given value for the *first* property matching this key. Add a
             new property if it doesn't already exist.
 @param      val the value to set
 @param      key the key for this property
 */
- (void)setProperty:(NSString*)val forKey:(NSString*)key;

/*!
 @brief      Remove *all* occurences of the property with the given key.
 @param      key
 */
- (void)unsetProperty:(NSString*)key;

/*!
 @brief      Return the value of the *first* occurrence of the given key.
 @param      key
 */
- (NSString*)propertyForKey:(NSString*)key;

/*!
 @brief      Add the given atom to the list, if it's not already present.
 @param      atom
 */
- (void)setAtom:(NSString*)atom;

/*!
 @brief      Remove *all* occurrences of the given atom.
 @param      atom
 */
- (void)unsetAtom:(NSString*)atom;

/*!
 @brief      Returns YES if the list contains at least one occurrence of
             the given atom.
 @param      atom
 @result     A boolean value.
 */
- (BOOL)isAtomSet:(NSString*)atom;

/*!
 @brief      Returns a TikZ-friendly string containing all of the properties.
 @result     A string.
 */
- (NSString*)stringList;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
