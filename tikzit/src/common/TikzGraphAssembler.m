//
//  TikzGraphAssembler.m
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

#import "TikzGraphAssembler.h"
#import "TikzGraphAssembler+Parser.h"
#import "tikzparser.h"
#import "tikzlexer.h"
#import "NSError+Tikzit.h"

void yyerror(TikzGraphAssembler *assembler, const char *str) {
	[assembler invalidateWithError:str];
}

@implementation TikzGraphAssembler

- (id)init {
	self = nil;
	return nil;
}

- (id)initWithGraph:(Graph*)g {
	self = [super init];
	if (self) {
		graph = [g retain];
		nodeMap = [[NSMutableDictionary alloc] init];
		yylex_init (&scanner);
		yyset_extra(self, scanner);
	}
	return self;
}

- (void)dealloc {
	[graph release];
	[nodeMap release];
	[lastError release];
	yylex_destroy (scanner);
	[super dealloc];
}

+ (BOOL) parseTikz:(NSString*)tikz forGraph:(Graph*)gr {
	return [self parseTikz:tikz forGraph:gr error:NULL];
}
+ (Graph*) parseTikz:(NSString*)tikz error:(NSError**)e {
	Graph *gr = [[Graph alloc] init];
	if ([self parseTikz:tikz forGraph:gr error:e]) {
		return [gr autorelease];
	} else {
		[gr release];
		return nil;
	}
}
+ (Graph*) parseTikz:(NSString*)tikz {
	return [self parseTikz:tikz error:NULL];
}

+ (BOOL) parseTikz:(NSString*)tikz forGraph:(Graph*)gr error:(NSError**)error {

	if([tikz length] == 0) {
		// empty string -> empty graph
		return YES;
	}

	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	TikzGraphAssembler *assembler = [[self alloc] initWithGraph:gr];
	[assembler autorelease];

	/*
	lineno = 1;
	tokenpos = 0;
	NSRange range = [tikz rangeOfString:@"\n"];
	NSString *firstLine;
	if (range.length == 0) {
		firstLine = tikz;
	} else {
		firstLine = [tikz substringToIndex:range.location];
	}
	if (![firstLine getCString:linebuff
					 maxLength:500
					  encoding:NSUTF8StringEncoding]) {
		// first line too long; just terminate it at the end of the buffer
		linebuff[499] = 0;
	}
	*/
	
	yy_scan_string([tikz UTF8String], [assembler scanner]);
	int result = yyparse(assembler);
	
	[pool drain];
	if (result == 0) {
		return YES;
	} else {
		if (error) {
			/*
			if (lastError) {
				*error = [[lastError retain] autorelease];
			} else
			*/
			if (result == 1) {
				*error = [NSError errorWithMessage:@"Syntax error"
											  code:TZ_ERR_PARSE];
			} else if (result == 2) {
				*error = [NSError errorWithMessage:@"Insufficient memory"
											  code:TZ_ERR_PARSE];
			} else {
				*error = [NSError errorWithMessage:@"Unknown error"
											  code:TZ_ERR_PARSE];
			}
		}
		return NO;
	}
}

+ (BOOL)validateTikzPropertyNameOrValue:(NSString*)tikz {
    BOOL r;
    
    NSString * testTikz = [NSString stringWithFormat: @"{%@}", tikz];
    
	void *scanner;
	yylex_init (&scanner);
	yyset_extra(nil, scanner);
	yy_scan_string([testTikz UTF8String], scanner);
	YYSTYPE lval;
	yylex(&lval, scanner);
    r = !(yyget_leng(scanner) < [testTikz length]);
	yylex_destroy(scanner);
    [testTikz autorelease];
    
    return r;
}

- (void)invalidate {
	[graph release];
	graph = nil;
	lastError = nil;
}

@end

@implementation TikzGraphAssembler (Parser)
- (Graph*)graph { return graph; }
- (void)addNodeToMap:(Node*)n {
	[nodeMap setObject:n forKey:[n name]];
}
- (Node*)nodeWithName:(NSString*)name {
	return [nodeMap objectForKey:name];
}
- (void) newLineStarted:(char *)text {
	/*
	strncpy(linebuff, yytext+1, 500);
	linebuff[499] = 0; // ensure null-terminated
	lineno++;
	tokenpos = 0;
	*/
}
- (void) incrementPosBy:(size_t)amount {
	//tokenpos += amount;
}

- (void) invalidateWithError:(const char *)message {
	/*
	// if the error is on the first line, treat specially
	if([assembler lineNumber] == 1){
		//strcpy(linebuff, yytext+1);
		NSLog(@"Problem ahoy!");
	}
	
	NSString *pointerStrPad = [@"" stringByPaddingToLength:(tokenpos-yyleng)
												withString:@" "
										   startingAtIndex:0];
	NSString *pointerStr = [@"" stringByPaddingToLength:yyleng
											 withString:@"^"
										startingAtIndex:0];
	NSLog(@"Parse error on line %i: %s\n%s\n%@\n", lineno, str, linebuff,
			[pointerStrPad stringByAppendingString:pointerStr]);
	NSDictionary *userInfo =
		[NSDictionary dictionaryWithObjectsAndKeys:
			[NSString stringWithUTF8String:str],
				NSLocalizedDescriptionKey,
			[NSNumber numberWithInt:lineno],
				@"lineNumber",
			[NSString stringWithUTF8String:linebuff],
				@"syntaxString",
			[NSNumber numberWithInt:tokenpos],
				@"tokenStart",
			[NSNumber numberWithInt:yyleng],
				@"tokenLength"];
	NSError *error =
		[NSError errorWithDomain:@"net.sourceforge.tikzit"
							code:TZ_ERR_PARSE
						userInfo:userInfo];
	
	lastError = [error retain];
						*/
	[self invalidate];
}
- (void*) scanner { return scanner; }
@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
