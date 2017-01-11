/*
 * Copyright 2013  Alex Merry <alex.merry@kdemail.net>
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

#import "NSString+Tikz.h"
#import "TikzGraphAssembler.h"

@implementation NSString (Tikz)

- (NSString*) tikzEscapedString {
	static NSCharacterSet *avoid = nil;
	if (avoid == nil)
#if __has_feature(objc_arc)
        avoid = [[NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ<>-'0123456789. "] invertedSet];
#else
    avoid = [[[NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ<>-'0123456789. "] invertedSet] retain];
#endif


	if ([self rangeOfCharacterFromSet:avoid].length > 0) {
		return [NSString stringWithFormat:@"{%@}", self];
	} else {
#if __has_feature(objc_arc)
        return self;
#else
		return [[self retain] autorelease];
#endif
	}
}

- (BOOL) isValidTikzPropertyNameOrValue {
	NSUInteger length = [self length];
	unsigned int brace_depth = 0;
	unsigned int escape = 0;
	for (NSUInteger i = 0; i < length; ++i) {
		unichar c = [self characterAtIndex:i];

		if (escape) {
			escape = 0;
		} else if (c == '\\') {
			escape = 1;
		} else if (c == '{') {
			brace_depth++;
		} else if (c == '}') {
			if (brace_depth == 0)
				return NO;
			brace_depth--;
		}
	}
	return !escape && brace_depth == 0;
}

- (BOOL) isValidAnchor {
	return [TikzGraphAssembler validateTikzEdgeAnchor:self];
}

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
