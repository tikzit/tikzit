//
//  BasicMapTable.h
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
 @class      BasicMapTable
 @brief      A stripped-down wrapper for NSMapTable.
 @details    A stripped-down wrapper for NSMapTable. In OS X, this is
             just an interface to NSMapTable.
 */
@interface BasicMapTable : NSObject {
	NSMapTable *mapTable;
}

- (id)init;
+ (BasicMapTable*)mapTable;
- (id)objectForKey:(id)aKey;
- (void)setObject:(id)anObject forKey:(id)aKey;
- (NSEnumerator*)objectEnumerator;
- (NSEnumerator*)keyEnumerator;
- (NSUInteger)count;

// for fast enumeration
- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state
								  objects:(id *)stackbuf
									count:(NSUInteger)len;
@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
