/*
 * Copyright 2013  Alex Merry <dev@randomguy3.me.uk>
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

/*
 * This file sets up some defs (particularly struct noderef) needed for
 * the tikz parser and its users.
 *
 * It is needed because we wish to support bison 2.3, which is the
 * version shipped with OSX.  bison 2.4 onwards allows us to put this
 * stuff in a "%code requires" block, where it will be put in the
 * generated header file by bison.
 *
 * All the types used by the %union directive in tikzparser.ym should
 * be declared, defined or imported here.
 */

// Foundation has NSPoint and NSString
#import <Foundation/Foundation.h>

@class TikzGraphAssembler;
@class GraphElementData;
@class GraphElementProperty;
@class Node;

struct noderef {
	Node *node;
	NSString *anchor;
};

// vi:ft=objc:noet:ts=4:sts=4:sw=4
