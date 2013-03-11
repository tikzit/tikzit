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
#import "NSError+Tikzit.h"

extern int yyparse(void);
extern int yylex(void);  
extern int yy_scan_string(const char* yy_str);
extern void yy_delete_buffer(int b);
extern int yylex_destroy(void);


static NSLock *parseLock = nil;
static id currentAssembler = nil;

extern int yylineno;
extern int yyleng;
int lineno;
int tokenpos;
extern char *yystr;
char linebuff[500];


void yyerror(const char *str) {
    // if the error is on the first line, treat specially
    if(lineno == 1){
//        strcpy(linebuff, yytext+1);
        NSLog(@"Problem ahoy!");
    }
    
    NSLog(@"Parse error on line %i: %s\n%s\n%@\n", lineno, str, linebuff, [[@"" stringByPaddingToLength:(tokenpos-yyleng) withString: @" " startingAtIndex:0] stringByAppendingString:[@"" stringByPaddingToLength:yyleng withString: @"^" startingAtIndex:0]]);
	if (currentAssembler != nil) {
        NSError *error = [NSError errorWithDomain:@"net.sourceforge.tikzit"
                                             code:TZ_ERR_PARSE
                                         userInfo:[NSDictionary dictionaryWithObjects:[NSArray arrayWithObjects:[NSString stringWithCString:str encoding:NSUTF8StringEncoding],
                                                                                       [NSNumber numberWithInt:lineno],
                                                                                       [NSString stringWithCString:linebuff encoding:NSUTF8StringEncoding],
                                                                                       [NSNumber numberWithInt:tokenpos],
                                                                                       [NSNumber numberWithInt:yyleng],
                                                                                       nil]
                                                                              forKeys: [NSArray arrayWithObjects:NSLocalizedDescriptionKey,
                                                                                        @"lineNumber",
                                                                                        @"syntaxString",
                                                                                        @"tokenStart",
                                                                                        @"tokenLength",
                                                                                        nil]]];
        
		[currentAssembler invalidateWithError:error];
	}
}

int yywrap() {
	return 1;
}

@implementation TikzGraphAssembler

- (id)init {
	[super init];
	graph = nil;
	currentNode = nil;
	currentEdge = nil;
	nodeMap = nil;
	return self;
}

- (Graph*)graph { return graph; }
- (NSError*)lastError { return lastError; }

- (GraphElementData *)data {
	if (currentNode != nil) {
		return [currentNode data];
	} else if (currentEdge != nil) {
		return [currentEdge data];
	} else {
		return [graph data];
	}
}

- (Node*)currentNode { return currentNode; }
- (Edge*)currentEdge { return currentEdge; }

- (BOOL)parseTikz:(NSString *)tikz {
	return [self parseTikz:tikz forGraph:[Graph graph]];
}

- (BOOL)parseTikz:(NSString*)tikz forGraph:(Graph*)gr {
	[parseLock lock];
    
    lineno = 1;
    tokenpos = 0;
    NSRange range = [tikz rangeOfString:@"\n"];
	if (![tikz getCString:linebuff
		        maxLength:500
			     encoding:NSUTF8StringEncoding]) {
		linebuff[0] = 0;
	} else {
		linebuff[range.location] = 0;
	}
	
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	currentAssembler = self;
	
	// set the current graph
	if (graph != gr) {
		[graph release];
		graph = [gr retain];
	}
	
	// the node map keeps track of the mapping of names to nodes
	nodeMap = [[NSMutableDictionary alloc] init];
    
	// do the parsing if actual input
    if([tikz length] > 0){
        yy_scan_string([tikz UTF8String]);
        yyparse();
        yylex_destroy();
    }
    
	[nodeMap release];
	nodeMap = nil;
	
	currentAssembler = nil;
	[pool drain];
	
	[parseLock unlock];
	
	return (graph != nil);
}

- (BOOL)testTikz:(NSString *)tikz{
    BOOL r;
    
    NSString * testTikz = [NSString stringWithFormat: @"{%@}", tikz];
    
	yy_scan_string([testTikz UTF8String]);
	yylex();
    
    r = !(yyleng < [testTikz length]);
    
    [testTikz autorelease];
	yylex_destroy();
    
    return r;
}

- (void)prepareNode {
	currentNode = [[Node alloc] init];
}

- (void)finishNode {
	if (currentEdge != nil) { // this is an edge node
		[currentEdge setEdgeNode:currentNode];
	} else { // this is a normal node
		[graph addNode:currentNode];
		[nodeMap setObject:currentNode forKey:[currentNode name]];
	}
	
	[currentNode release];
	currentNode = nil;
}

- (void)prepareEdge {
	currentEdge = [[Edge alloc] init];
}

- (void)finishEdge {
	[currentEdge setAttributesFromData];
	[graph addEdge:currentEdge];
	[currentEdge release];
	currentEdge = nil;
}

- (void)setEdgeSource:(NSString*)edge anchor:(NSString*)anch {
    Node *s = [nodeMap objectForKey:edge];
    [currentEdge setSource:s];
    [currentEdge setSourceAnchor:anch];
}

- (void)setEdgeTarget:(NSString*)edge anchor:(NSString*)anch {
	if (![edge isEqualToString:@""]) {
		[currentEdge setTarget:[nodeMap objectForKey:edge]];
        [currentEdge setTargetAnchor:anch];
	} else {
        [currentEdge setTargetAnchor:anch];
        [currentEdge setTarget:[currentEdge source]];
	}
}

- (void)dealloc {
	[graph release];
	[lastError release];
	[super dealloc];
}

- (void)invalidate {
	[graph release];
	graph = nil;
	lastError = nil;
}

- (void)invalidateWithError:(NSError*)error {
	[self invalidate];
	lastError = [error retain];
}

+ (void)setup {
	parseLock = [[NSLock alloc] init];
}

+ (TikzGraphAssembler*)currentAssembler {
	return currentAssembler;
}

+ (TikzGraphAssembler*)assembler {
	return [[[TikzGraphAssembler alloc] init] autorelease];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
