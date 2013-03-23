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
#import "tikzparser.h"
#import "TikzGraphAssembler+Parser.h"
#import "tikzlexer.h"
#import "NSError+Tikzit.h"

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

- (BOOL) parseTikz:(NSString*)t error:(NSError**)error {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	tikzStr = [t UTF8String];
	yy_scan_string(tikzStr, scanner);
	int result = yyparse(self);
	tikzStr = NULL;

	[pool drain];

	if (result == 0) {
		return YES;
	} else {
		if (error) {
			if (lastError) {
				*error = [[lastError retain] autorelease];
			} else if (result == 1) {
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

	TikzGraphAssembler *assembler = [[self alloc] initWithGraph:gr];
	BOOL success = [assembler parseTikz:tikz error:error];
	[assembler release];
	return success;
}

+ (BOOL)validateTikzPropertyNameOrValue:(NSString*)tikz {
    BOOL r;
    
    NSString * testTikz = [NSString stringWithFormat: @"{%@}", tikz];
    
	void *scanner;
	yylex_init (&scanner);
	yyset_extra(nil, scanner);
	yy_scan_string([testTikz UTF8String], scanner);
	YYSTYPE lval;
	YYLTYPE lloc;
	yylex(&lval, &lloc, scanner);
    r = !(yyget_leng(scanner) < [testTikz length]);
	yylex_destroy(scanner);
    [testTikz autorelease];
    
    return r;
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

- (void) setLastError:(NSError*)error {
	[error retain];
	[lastError release];
	lastError = error;
}

- (void) reportError:(const char *)message atLocation:(YYLTYPE*)yylloc {
	NSString *nsmsg = [NSString stringWithUTF8String:message];
	
	const char *first_line_start = find_start_of_nth_line (
			tikzStr, yylloc->first_line - 1);
	const char *last_line_start = find_start_of_nth_line (
			first_line_start, yylloc->last_line - yylloc->first_line);
	const char *last_line_end = last_line_start;
	while (*last_line_end && *last_line_end != '\n') {
		// points to just after end of last line
		++last_line_end;
	}
	const char *error_start = first_line_start + (yylloc->first_column - 1);
	const char *error_end = last_line_start + (yylloc->last_column - 1);
	
	if (error_start > error_end || error_end > last_line_end) {
		// error position state is corrupted
		NSLog(@"Got bad error state for error \"%s\": start(%i,%i), end(%i,%i)",
				message,
				yylloc->first_line,
				yylloc->first_column,
				yylloc->last_line,
				yylloc->last_column);
		[self setLastError:[NSError errorWithMessage:nsmsg
												code:TZ_ERR_PARSE]];
	} else {
		// +1 for null terminator
		size_t error_text_len = last_line_end - first_line_start;
		char *error_text = malloc (error_text_len + 1);
		strncpy (error_text, first_line_start, error_text_len);
		*(error_text + error_text_len) = '\0';
		
		int error_start_pos = error_start - first_line_start;
		int error_end_pos = error_end - first_line_start;

		NSDictionary *userInfo =
			[NSDictionary dictionaryWithObjectsAndKeys:
				nsmsg,
					NSLocalizedDescriptionKey,
				[NSNumber numberWithInt:yylloc->first_line],
					@"startLine",
				[NSNumber numberWithInt:yylloc->first_column],
					@"startColumn",
				[NSNumber numberWithInt:yylloc->last_line],
					@"endLine",
				[NSNumber numberWithInt:yylloc->last_column],
					@"endColumn",
				[NSString stringWithUTF8String:error_text],
					@"syntaxString",
				[NSNumber numberWithInt:error_start_pos],
					@"tokenStart",
				[NSNumber numberWithInt:error_end_pos],
					@"tokenLength",
				nil];
		[self setLastError:
			[NSError errorWithDomain:TZErrorDomain
								code:TZ_ERR_PARSE
							userInfo:userInfo]];
		
		// we can now freely edit error_text
		// we only bother printing out the first line
		if (yylloc->last_line > yylloc->first_line) {
			char *nlp = strchr(error_text, '\n');
			if (nlp) {
				*nlp = '\0';
				error_text_len = nlp - error_text;
				if (error_end_pos > error_text_len)
					error_end_pos = error_text_len;
			}
		}
		NSString *pointerLinePadding =
			[@"" stringByPaddingToLength:error_start_pos
							  withString:@" "
						 startingAtIndex:0];
		NSString *pointerLineCarets =
			[@"" stringByPaddingToLength:(error_end_pos - error_start_pos)
							  withString:@"^"
						 startingAtIndex:0];
		NSLog(@"Parse error on line %i, starting at %i: %s\n%s\n%@%@",
				yylloc->first_line,
				yylloc->first_column,
				message,
				error_text,
				pointerLinePadding,
				pointerLineCarets);
		free (error_text);
	}
}
- (void*) scanner { return scanner; }
@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
