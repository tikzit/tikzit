/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#import <Foundation/Foundation.h>
#import "NodeStyle.h"
#import "EdgeStyle.h"

@interface StyleManager: NSObject {
    NSMutableArray *nodeStyles;
    NSMutableArray *edgeStyles;
}

+ (StyleManager*) manager;
- (id) init;

@property (readonly) NSArray   *nodeStyles;
@property (readonly) NSArray   *edgeStyles;

// only for use by loading code
- (void) _setNodeStyles:(NSMutableArray*)styles;
- (void) _setEdgeStyles:(NSMutableArray*)styles;

- (NodeStyle*) nodeStyleForName:(NSString*)name;
- (EdgeStyle*) edgeStyleForName:(NSString*)name;

- (void) addNodeStyle:(NodeStyle*)style;
- (void) removeNodeStyle:(NodeStyle*)style;
- (void) addEdgeStyle:(EdgeStyle*)style;
- (void) removeEdgeStyle:(EdgeStyle*)style;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
