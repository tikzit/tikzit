//
//  NSString+LatexConstants.m
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

#import "NSString+LatexConstants.h"

// can't use sizeof() in non-fragile ABI (eg: clang)
#define texConstantCount 63
static NSString *texConstantNames[texConstantCount] = {
	@"alpha",
	@"beta",
	@"gamma",
	@"delta",
	@"epsilon",
	@"zeta",
	@"eta",
	@"theta",
	@"iota",
	@"kappa",
	@"lambda",
	@"mu",
	@"nu",
	@"xi",
	@"pi",
	@"rho",
	@"sigma",
	@"tau",
	@"upsilon",
	@"phi",
	@"chi",
	@"psi",
	@"omega",
	@"Gamma",
	@"Delta",
	@"Theta",
	@"Lambda",
	@"Xi",
	@"Pi",
	@"Sigma",
	@"Upsilon",
	@"Phi",
	@"Psi",
	@"Omega",
	
	@"pm",
	@"to",
	@"Rightarrow",
	@"Leftrightarrow",
	@"forall",
	@"partial",
	@"exists",
	@"emptyset",
	@"nabla",
	@"in",
	@"notin",
	@"prod",
	@"sum",
	@"surd",
	@"infty",
	@"wedge",
	@"vee",
	@"cap",
	@"cup",
	@"int",
	@"approx",
	@"neq",
	@"equiv",
	@"leq",
	@"geq",
	@"subset",
	@"supset",
	@"cdot",
	@"ldots"
};

static char * texConstantCodes[texConstantCount] = {
	"\u03b1","\u03b2","\u03b3","\u03b4","\u03b5","\u03b6","\u03b7",
	"\u03b8","\u03b9","\u03ba","\u03bb","\u03bc","\u03bd","\u03be",
	"\u03c0","\u03c1","\u03c3","\u03c4","\u03c5","\u03c6","\u03c7",
	"\u03c8","\u03c9","\u0393","\u0394","\u0398","\u039b","\u039e",
	"\u03a0","\u03a3","\u03a5","\u03a6","\u03a8","\u03a9",
	
	"\u00b1","\u2192","\u21d2","\u21d4","\u2200","\u2202","\u2203",
	"\u2205","\u2207","\u2208","\u2209","\u220f","\u2211","\u221a",
	"\u221e","\u2227","\u2228","\u2229","\u222a","\u222b","\u2248",
	"\u2260","\u2261","\u2264","\u2265","\u2282","\u2283","\u22c5",
	"\u2026"
};

#define texModifierCount 10
static NSString *texModifierNames[texModifierCount] = {
	@"tiny",
	@"scriptsize",
	@"footnotesize",
	@"small",
	@"normalsize",
	@"large",
	@"Large",
	@"LARGE",
	@"huge",
	@"Huge"
};

static NSDictionary *texConstants = nil;
static NSSet *texModifiers = nil;

@implementation NSString(LatexConstants)

- (NSString*)stringByExpandingLatexConstants {

	if (texConstants == nil) {
		NSMutableDictionary *constants = [[NSMutableDictionary alloc] initWithCapacity:texConstantCount];
		for (int i = 0; i < texConstantCount; ++i) {
			[constants setObject:[NSString stringWithUTF8String:texConstantCodes[i]] forKey:texConstantNames[i]];
		}
		texConstants = constants;
	}
	if (texModifiers == nil) {
		texModifiers = [[NSSet alloc] initWithObjects:texModifierNames count:texModifierCount];
	}

	NSMutableString *buf = [[NSMutableString alloc] initWithCapacity:[self length]];
	NSMutableString *wordBuf = [[NSMutableString alloc] initWithCapacity:10];
	
	unichar c_a = [@"a" characterAtIndex:0];
	unichar c_z = [@"z" characterAtIndex:0];
	unichar c_A = [@"A" characterAtIndex:0];
	unichar c_Z = [@"Z" characterAtIndex:0];
	
	int state = 0;
	// a tiny little DFA to replace \\([\w*]) with unicode of $1
	unichar c;
	NSString *code;
	int i;
	for (i = 0; i<[self length]; ++i) {
		c = [self characterAtIndex:i];
		switch (state) {
			case 0:
				if (c=='\\') {
					state = 1;
				} else {
					[buf appendFormat:@"%C", c];
				}
				break;
			case 1:
				if ((c>=c_a && c<=c_z) || (c>=c_A && c<=c_Z)) {
					[wordBuf appendFormat:@"%C", c];
				} else {
					code = [texConstants objectForKey:wordBuf];
					if (code != nil) {
						[buf appendString:code];
					} else if (![texModifiers containsObject:wordBuf]) {
						[buf appendFormat:@"\\%@", wordBuf];
					}
					
					[wordBuf setString:@""];
					if (c=='\\') {
						state = 1;
					} else {
						[buf appendFormat:@"%C", c];
						state = 0;
					}
					
				}
				break;
		}
	}
	
	if (state == 1) {
		code = [texConstants objectForKey:wordBuf];
		if (code != nil) {
			[buf appendString:code];
		} else if (![texModifiers containsObject:wordBuf]) {
			[buf appendFormat:@"\\%@", wordBuf];
		}
	}
	
	NSString *ret = [buf copy];
	[buf release];
	[wordBuf release];

	return [ret autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
