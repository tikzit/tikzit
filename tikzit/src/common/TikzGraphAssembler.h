//
//  TikzGraphAssembler.h
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
#import "Graph.h"

/**
 * Parses (a subset of) tikz code and produces the corresponding Graph
 *
 * A note on errors:
 * If parsing fails and a non-NULL error argument is given, it will be
 * populated with an error with domain TZErrorDomain and code TZ_ERR_PARSE
 * (see NSError+Tikzit.h).
 *
 * This will have a description set, typically something like
 *   "syntax error, unexpected [, expecting ("
 * It may also have the following keys (it will have all or none of these),
 * where numbers are stored using NSNumber:
 *   - startLine:    the line (starting at 1) containing the first character
 *                   of the bad token
 *   - startColumn:  the column (starting at 1; tabs count for 1) of the first
 *                   character of the bad token
 *   - endLine:      the line (starting at 1) containing the last character
 *                   of the bad token
 *   - endColumn:    the column (starting at 1; tabs count for 1) of the last
 *                   character of the bad token
 *   - syntaxString: an excerpt of the input string (typically the contents
 *                   from startLine to endLine) providing some context
 *   - tokenOffset:  the character offset (starting at 0) of the bad token
 *                   within syntaxString
 *   - tokenLength:  the character length (including newlines) of the bad token
 *                   within syntaxString
 */
@interface TikzGraphAssembler : NSObject {
	const char *tikzStr;
	Graph *graph;
	void *scanner;
	NSMutableDictionary *nodeMap;
	NSError *lastError;
}

/**
 * Parse tikz and place the result in gr
 *
 * Note that the graph must be empty; this might be used from an init
 * method, for example, although don't forget that you can return a
 * different object in init methods, providing you get the allocation
 * right.
 *
 * @param tikz   the tikz string to parse
 * @param gr     the graph to store the result in (must be empty, non-nil)
 * @param e      a location to store an error if parsing fails (may be NULL)
 * @return       YES if parsing succeeded, NO otherwise
 */
+ (BOOL) parseTikz:(NSString*)tikz forGraph:(Graph*)gr error:(NSError**)e;
/**
 * Overload for -[parseTikz:forGraph:error:] with the error set to NULL
 */
+ (BOOL) parseTikz:(NSString*)tikz forGraph:(Graph*)gr;
/**
 * Parse tikz
 *
 * @param tikz   the tikz string to parse
 * @param e      a location to store an error if parsing fails (may be NULL)
 * @return       a Graph object if parsing succeeded, nil otherwise
 */
+ (Graph*) parseTikz:(NSString*)tikz error:(NSError**)e;
/**
 * Overload for -[parseTikz:error:] with the error set to NULL
 */
+ (Graph*) parseTikz:(NSString*)tikz;
/**
 * Validate a property string or value
 *
 * Wraps the string in "{" and "}" and checks it lexes completely; in other
 * words, makes sure that "{" and "}" are balanced (ignoring escaped versions).
 * @param tikz   the string to validate
 * @return       YES if the string can be used as a property name or value, NO
 *               otherwise
 */
+ (BOOL)validateTikzPropertyNameOrValue:(NSString*)tikz;

/**
 * Validate an edge anchor
 *
 * Checks that the given string will successfully lex if used as an anchor for
 * and edge
 * @param tikz   the string to validate
 * @return       YES if the string can be used as an edge anchor, NO otherwise
 */
+ (BOOL)validateTikzEdgeAnchor:(NSString*)tikz;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
