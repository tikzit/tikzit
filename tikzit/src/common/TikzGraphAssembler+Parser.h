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

/**
 * TikzGraphAssember+Parser.h
 *
 * This file exposes some TikzGraphAssembler functions
 * that are only of use to the parser.
 */

#import "TikzGraphAssembler.h"

@interface TikzGraphAssembler (Parser)
- (Graph*) graph;
/** Store a node so that it can be looked up by name later */
- (void) addNodeToMap:(Node*)n;
/** Get a previously-stored node by name */
- (Node*) nodeWithName:(NSString*)name;
- (void) newLineStarted:(char *)text;
- (void) incrementPosBy:(size_t)amount;
- (void) invalidateWithError:(const char *)message;
- (void*) scanner;
@end

#define YY_EXTRA_TYPE TikzGraphAssembler *
#define YYLEX_PARAM [assembler scanner]
void yyerror(TikzGraphAssembler *assembler, const char *str);

// vi:ft=objc:noet:ts=4:sts=4:sw=4
