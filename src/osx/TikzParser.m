//
//  TikzParser.m
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

#import "TikzParser.h"

// custom parsekit extensions
#import "PKNaturalNumber.h"
#import "PKRepetition+RepeatPlus.h"
#import "PKSpecificDelimitedString.h"
#import "PKBalancingDelimitState.h"

#import "util.h"

@interface TikzParser ()

- (NSString*)popAllToString:(PKAssembly*)a withSeparator:(NSString*)sep;
- (PKParser*)eatSymbol:(NSString*)s;
- (PKParser*)eatLiteral:(NSString*)s;
- (PKParser*)eatWord;

// properties
- (void)willMatchProplist:(PKAssembly*)a;
- (void)didMatchProplist:(PKAssembly*)a;
- (void)willMatchProperty:(PKAssembly*)a;
- (void)didMatchArrowSpecDash:(PKAssembly*)a;

// nodes
- (void)didMatchNodeCommand:(PKAssembly*)a;
- (void)didMatchNodeLabel:(PKAssembly*)a;
- (void)didMatchNode:(PKAssembly*)a;
- (void)didMatchNodeName:(PKAssembly*)a;
- (void)didMatchCoords:(PKAssembly*)a;

// edges
- (void)didMatchDrawCommand:(PKAssembly *)a;
- (void)didMatchEdge:(PKAssembly*)a;
- (void)didMatchEdgeNodeCommand:(PKAssembly*)a;
- (void)didMatchEdgeNode:(PKAssembly*)a;

// bounding box
- (void)didMatchPathCommand:(PKAssembly*)a;
- (void)didMatchBoundingBox:(PKAssembly*)a;

// tikzpicture
- (void)willMatchTikzPicture:(PKAssembly*)a;
- (void)didMatchTikzPicture:(PKAssembly*)a;

@end


@implementation TikzParser

@synthesize graph;

- (id)init {
	[super init];
	
	currentKey = nil;
	currentSourceArrow = nil;
	tokenizer = [PKTokenizer tokenizer];
	
	graph = nil;
	currentNode = nil;
	currentEdge = nil;
	matchingEdgeNode = NO;
	
	// tweak the tokenizer a bit
	[tokenizer.symbolState remove:@"<="];
	[tokenizer.symbolState remove:@">="];
	[tokenizer.symbolState remove:@"{"];
	[tokenizer.symbolState remove:@"}"];
	[tokenizer setTokenizerState:tokenizer.wordState from:'\\' to:'\\'];
	[tokenizer.wordState setWordChars:NO from:'-' to:'-'];
	tokenizer.delimitState = [[PKBalancingDelimitState alloc] init];
	[tokenizer.delimitState addStartMarker:@"{"
								 endMarker:@"}"
					   allowedCharacterSet:nil];
	[tokenizer setTokenizerState:tokenizer.delimitState from:'{' to:'{'];
	
	/*
	 
	 
	 GRAMMAR FOR TIKZPICTURE
	 
	 tikzpicture   = '\begin' '{tikzpicture}'
	                 optproplist
	                 expr*
	                 '\end' '{tikzpicture}'
	 expr          = node | edge | boundingbox | layerexpr
	 layerexpr     = '\begin' '{pgfonlayer}' DelimitedString | '\end' '{pgfonlayer}'
	 
	 
	 GRAMMAR FOR PROPERTY LISTS
	 
	 optproplist   = proplist | Empty;
	 proplist      = '[' property property1* ']';
	 property      = arrowspec | keyval | atom;
	 property1     = ',' property;
	 keyval        = key '=' val;
	 atom          = propsym+;
	 arrowspec     = propsym* '-' propsym*;
	 key           = propsym+;
	 val           = propsym+ | QuotedString;
	 propsym       = (Word | Number | '<' | '>');
	 
	 
	 GRAMMAR FOR NODES
	 
	 node          = '\node' optproplist name 'at' coords DelimitedString ';';
	 nodename      = '(' nodeid ')';
	 nodeid        = Word | NaturalNumber;
	 coords        = '(' Number ',' Number ')';
	 
	 
	 GRAMMAR FOR EDGES
	 
	 edge          = '\draw' optproplist nodename 'to' optedgenode ( nodename | selfloop ) ';';
	 selfloop      = '(' ')';
	 optedgenode   = Empty | edgenode
	 edgenode      = 'node' optproplist name coords '{' '}' ';';
	 
	 GRAMMAR FOR BOUNDING BOX
	 
	 boundingbox   = '\path' '[' 'use' 'as' 'bounding' 'box' ']' coords 'rectangle' coords ';'
	 
	 */
	
	
	PKAlternation *nodeid = [PKAlternation alternation];
	nodeid.name = @"node identifier";
	[nodeid add:[PKWord word]];
	[nodeid add:[PKNaturalNumber number]];
	
	PKAlternation *propsym = [PKAlternation alternation];
	propsym.name = @"property symbol";
	[propsym add:[PKWord word]];
	[propsym add:[PKNumber number]];
	[propsym add:[PKSymbol symbolWithString:@"<"]];
	[propsym add:[PKSymbol symbolWithString:@">"]];
	
	PKSequence *anchor = [PKSequence sequence];
	[anchor add:[self eatSymbol:@"."]];
	[anchor add:[self eatWord]];
	
	PKAlternation *optanchor = [PKAlternation alternation];
	[optanchor add:anchor];
	[optanchor add:[PKEmpty empty]];
	
	PKSequence *nodename = [PKSequence sequence];
	nodename.name = @"node name";
	[nodename add:[self eatSymbol:@"("]];
	[nodename add:nodeid];
	[nodename add:optanchor];
	[nodename add:[self eatSymbol:@")"]];
	[nodename setAssembler:self selector:@selector(didMatchNodeName:)];
	
	PKTrack *coords = [PKTrack track];
	coords.name = @"coordinate definition";
	[coords add:[self eatSymbol:@"("]];
	[coords add:[PKNumber number]];
	[coords add:[self eatSymbol:@","]];
	[coords add:[PKNumber number]];
	[coords add:[self eatSymbol:@")"]];
	[coords setAssembler:self selector:@selector(didMatchCoords:)];
	
	PKSequence *key = [PKRepetition repetitionPlusWithSubparser:propsym];
	
	PKAlternation *val = [PKAlternation alternation];
	[val add:[PKRepetition repetitionPlusWithSubparser:propsym]];
	[val add:[PKQuotedString quotedString]];
	[val setPreassembler:self selector:@selector(willMatchVal:)];
	
	PKSequence *keyval = [PKSequence sequence];
	[keyval add:key];
	[keyval add:[self eatLiteral:@"="]];
	[keyval add:val];
	
	PKSequence *atom = [PKRepetition repetitionPlusWithSubparser:propsym];
	
	PKSymbol *arrowspecdash = [PKSymbol symbolWithString:@"-"];
	[arrowspecdash setAssembler:self selector:@selector(didMatchArrowSpecDash:)];
	
	PKSequence *arrowspec = [PKSequence sequence];
	[arrowspec add:[PKRepetition repetitionWithSubparser:propsym]];
	[arrowspec add:arrowspecdash];
	[arrowspec add:[PKRepetition repetitionWithSubparser:propsym]];
	
	PKAlternation *property = [PKAlternation alternation];
	property.name = @"property, atom, or arrow specification";
	[property add:keyval];
	[property add:arrowspec];
	[property add:atom];
	[property setPreassembler:self selector:@selector(willMatchProperty:)];
	
	PKSequence *property1 = [PKSequence sequence];
	[property1 add:[self eatLiteral:@","]];
	[property1 add:property];
	
	PKTrack *proplist = [PKTrack track];
	proplist.name = @"property list";
	[proplist add:[self eatSymbol:@"["]];
	[proplist add:property];
	[proplist add:[PKRepetition repetitionWithSubparser:property1]];
	[proplist add:[self eatSymbol:@"]"]];
	[proplist setPreassembler:self selector:@selector(willMatchProplist:)];
	[proplist setAssembler:self selector:@selector(didMatchProplist:)];
	
	PKAlternation *optproplist = [PKAlternation alternation];
	[optproplist add:proplist];
	[optproplist add:[PKEmpty empty]];
	
	PKLiteral *nodeCommand = [PKLiteral literalWithString:@"\\node"];
	[nodeCommand setAssembler:self selector:@selector(didMatchNodeCommand:)];
	
	PKTerminal *nodeLabel = [PKDelimitedString delimitedString];
	nodeLabel.name = @"Possibly empty node label";
	[nodeLabel setAssembler:self selector:@selector(didMatchNodeLabel:)];
	
	PKTrack *node = [PKTrack track];
	[node add:nodeCommand];
	[node add:optproplist];
	[node add:nodename];
	[node add:[self eatLiteral:@"at"]];
	[node add:coords];
	[node add:nodeLabel];
	//[node add:[[PKDelimitedString delimitedString] discard]];
	[node add:[self eatSymbol:@";"]];
	[node setAssembler:self selector:@selector(didMatchNode:)];
	
	PKLiteral *drawCommand = [PKLiteral literalWithString:@"\\draw"];
	[drawCommand setAssembler:self selector:@selector(didMatchDrawCommand:)];
	
	PKSequence *parens = [PKSequence sequence];
	[parens add:[self eatSymbol:@"("]];
	[parens add:[self eatSymbol:@")"]];
	
	PKAlternation *nodenamealt = [PKAlternation alternation];
	nodenamealt.name = @"node name or '()'";
	[nodenamealt add:nodename];
	[nodenamealt add:parens];
	
	PKLiteral *edgenodeCommand = [PKLiteral literalWithString:@"node"];
	edgenodeCommand.name = @"edge node command";
	[edgenodeCommand setAssembler:self selector:@selector(didMatchEdgeNodeCommand:)];
	
	PKSequence *edgenode = [PKSequence sequence];
	[edgenode add:edgenodeCommand];
	[edgenode add:optproplist];
	[edgenode add:nodeLabel];
	edgenode.name = @"edge node";
	[edgenode setAssembler:self selector:@selector(didMatchEdgeNode:)];
	
	
	PKAlternation *optedgenode = [PKAlternation alternation];
	[optedgenode add:[PKEmpty empty]];
	[optedgenode add:edgenode];
	
	
	PKTrack *edge = [PKTrack track];
	[edge add:drawCommand];
	[edge add:optproplist];
	[edge add:nodename];
	[edge add:[self eatLiteral:@"to"]];
	[edge add:optedgenode];
	[edge add:nodenamealt];
	[edge add:[self eatSymbol:@";"]];
	[edge setAssembler:self selector:@selector(didMatchEdge:)];
	
	
	PKLiteral *pathliteral = [PKLiteral literalWithString:@"\\path"];
	[pathliteral setAssembler:self selector:@selector(didMatchPathCommand:)];
	
	PKTrack *boundingbox = [PKTrack track];
	[boundingbox add:pathliteral];
	[boundingbox add:[self eatSymbol:@"["]];
	[boundingbox add:[self eatLiteral:@"use"]];
	[boundingbox add:[self eatLiteral:@"as"]];
	[boundingbox add:[self eatLiteral:@"bounding"]];
	[boundingbox add:[self eatLiteral:@"box"]];
	[boundingbox add:[self eatSymbol:@"]"]];
	[boundingbox add:coords];
	[boundingbox add:[self eatLiteral:@"rectangle"]];
	[boundingbox add:coords];
	[boundingbox add:[self eatSymbol:@";"]];
	[boundingbox setAssembler:self selector:@selector(didMatchBoundingBox:)];
	
	PKTerminal *layerLiteral =
		[[PKSpecificDelimitedString delimitedStringWithValue:@"{pgfonlayer}"]
		 discard];
	
	PKSequence *beginLayer = [PKSequence sequence];
	[beginLayer add:[self eatLiteral:@"\\begin"]];
	[beginLayer add:layerLiteral];
	[beginLayer add:[[PKDelimitedString delimitedString] discard]];
	
	PKSequence *endLayer = [PKSequence sequence];
	[endLayer add:[self eatLiteral:@"\\end"]];
	[endLayer add:layerLiteral];
	
	PKAlternation *expr = [PKAlternation alternation];
	[expr add:node];
	[expr add:edge];
	[expr add:boundingbox];
	[expr add:beginLayer];
	[expr add:endLayer];
	
	PKTerminal *tikzpicLiteral =
		[[PKSpecificDelimitedString delimitedStringWithValue:@"{tikzpicture}"]
		 discard];
	
	//tikzpicLiteral.name = @"{tikzpicture}";
	
	PKTrack *tikzpic = [PKTrack track];
	[tikzpic add:[PKEmpty empty]];
	[tikzpic add:[self eatLiteral:@"\\begin"]];
	[tikzpic add:tikzpicLiteral];
	[tikzpic add:optproplist];
	[tikzpic add:[PKRepetition repetitionWithSubparser:expr]];
	[tikzpic add:[self eatLiteral:@"\\end"]];
	[tikzpic add:tikzpicLiteral];
	[tikzpic setPreassembler:self selector:@selector(willMatchTikzPicture:)];
	[tikzpic setAssembler:self selector:@selector(didMatchTikzPicture:)];
	
	nodeParser = node;
	edgeParser = edge;
	tikzPictureParser = tikzpic;
	
	return self;
}

- (NSString*)popAllToString:(PKAssembly*)a withSeparator:(NSString*)sep {
	NSString *str = @"";
	BOOL fst = YES;
	
	while (![a isStackEmpty]) {
		if (fst) fst = NO;
		else str = [sep stringByAppendingString:str];
		
		PKToken *tok = [a pop];
		str = [tok.stringValue stringByAppendingString:str];
	}
	
	return str;
}

- (PKParser*)eatSymbol:(NSString*)s {
	return [[PKSymbol symbolWithString:s] discard];
}

- (PKParser*)eatLiteral:(NSString*)s {
	return [[PKLiteral literalWithString:s] discard];
}

- (PKParser*)eatWord {
	return [[PKWord word] discard];
}

- (void)packProperty:(PKAssembly*)a {
	BOOL empty = [a isStackEmpty];
	NSString *val = [self popAllToString:a withSeparator:@" "];
	
	if (currentKey != nil) {
		[elementData setProperty:val forKey:currentKey];
//		NSLog(@"  keyval: (%@) => (%@)", currentKey, val);
	} else if (currentSourceArrow != nil) {
		[elementData setArrowSpecFrom:currentSourceArrow to:val];
//		NSLog(@"  arrowspec: (%@-%@)", currentSourceArrow, val);
	} else if (!empty) {
		[elementData setAtom:val];
//		NSLog(@"  atom: (%@)", val);
	}
	
	currentKey = nil;
	currentSourceArrow = nil;
}

- (BOOL)parseNode:(NSString *)str {
	tokenizer.string = str;
	PKAssembly *res = [nodeParser completeMatchFor:[PKTokenAssembly assemblyWithTokenizer:tokenizer]];
	
//	NSLog(@"result: %@", res);
	return res != nil;
}

- (BOOL)parseEdge:(NSString *)str {
	tokenizer.string = str;
	PKAssembly *res = [edgeParser completeMatchFor:[PKTokenAssembly assemblyWithTokenizer:tokenizer]];
	
//	NSLog(@"result: %@", res);
	return res != nil;
}

- (BOOL)parseTikzPicture:(NSString*)str forGraph:(Graph*)g {
	self.graph = g;
	tokenizer.string = str;
	PKTokenAssembly *assm = [PKTokenAssembly assemblyWithTokenizer:tokenizer];
	PKAssembly *res = [tikzPictureParser completeMatchFor:assm];
	
//	NSLog(@"result: %@", res);
	return res != nil;
}

- (BOOL)parseTikzPicture:(NSString *)str {
	return [self parseTikzPicture:str forGraph:[Graph graph]];
}


- (void)didMatchNodeCommand:(PKAssembly*)a {
	[a pop];
	currentNode = [Node node];
	[currentNode updateData];
//	NSLog(@"<node>");
}

- (void)didMatchNodeLabel:(PKAssembly*)a {
	PKToken *tok = [a pop];
	NSString *s = tok.stringValue;
	s = [s substringWithRange:NSMakeRange(1, [s length]-2)];
	if (matchingEdgeNode) currentEdge.edgeNode.label = s;
	else currentNode.label = s;
}

- (void)didMatchNode:(PKAssembly*)a {
	[nodeTable setObject:currentNode forKey:currentNode.name];
	[graph addNode:currentNode];
	currentNode = nil;
//	NSLog(@"</node>");
}

- (void)didMatchDrawCommand:(PKAssembly*)a {
	[a pop];
	currentEdge = [Edge edge];
	sourceName = nil;
	targName = nil;
//	NSLog(@"<edge>");
}

- (void)didMatchEdge:(PKAssembly*)a {
	Node *src = [nodeTable objectForKey:sourceName];
	currentEdge.source = src;
	currentEdge.target = (targName == nil) ? src : [nodeTable objectForKey:targName];
	[currentEdge setAttributesFromData];
	[graph addEdge:currentEdge];
	currentEdge = nil;
//	NSLog(@"</edge>");
}

- (void)didMatchEdgeNodeCommand:(PKAssembly*)a {
	[a pop];
	matchingEdgeNode = YES;
	currentEdge.edgeNode = [Node node];
}

- (void)didMatchEdgeNode:(PKAssembly*)a {
	matchingEdgeNode = NO;
}

- (void)willMatchVal:(PKAssembly*)a {
	currentKey = [self popAllToString:a withSeparator:@" "];
//	NSLog(@"key: %@", currentKey);
}

- (void)willMatchProperty:(PKAssembly*)a {
	[self packProperty:a];
}

- (void)willMatchProplist:(PKAssembly*)a {
	elementData = [[GraphElementData alloc] init];
}

- (void)didMatchProplist:(PKAssembly*)a {
	[self packProperty:a];
	
	if (currentNode != nil) {
		currentNode.data = elementData;
	} else if (currentEdge != nil) {
		if (matchingEdgeNode) currentEdge.edgeNode.data = elementData;
		else currentEdge.data = elementData;
	} else { // add properties to to graph
		graph.data = elementData;
	}
	
	elementData = nil;
}

- (void)didMatchNodeName:(PKAssembly*)a {
	NSString *name = ((PKToken*)[a pop]).stringValue;
	
	if (currentNode != nil) {
		currentNode.name = name;
//		NSLog(@"  name: (%@)", name);
	} else if (currentEdge != nil) {
		if (sourceName == nil) {
			sourceName = name;
//			NSLog(@"  source: (%@)", name);
		} else {
			targName = name;
//			NSLog(@"  target: (%@)", name);
		}
	}
}

- (void)didMatchCoords:(PKAssembly*)a {
	NSPoint p;
	p.y = ((PKToken*)[a pop]).floatValue;
	p.x = ((PKToken*)[a pop]).floatValue;
	
	if (currentNode != nil) {
		currentNode.point = p;
	} else {
		if (bboxFirstPoint) {
			bboxFirstPoint = NO;
			bbox1 = p;
		} else {
			bbox2 = p;
		}
	}
	
//	NSLog(@"  coord: (%f, %f)", p.x, p.y);
}

- (void)didMatchPathCommand:(PKAssembly*)a {
	[a pop];
	bboxFirstPoint = YES;
}

- (void)didMatchBoundingBox:(PKAssembly*)a {
	graph.boundingBox = NSRectAroundPoints(bbox1, bbox2);
}

- (void)didMatchArrowSpecDash:(PKAssembly*)a {
	[a pop]; // pop off the dash
	currentSourceArrow = [self popAllToString:a withSeparator:@" "];
}

- (void)willMatchTikzPicture:(PKAssembly*)a {
//	NSLog(@"<tikz>");
	nodeTable = [NSMutableDictionary dictionary];
}

- (void)didMatchTikzPicture:(PKAssembly*)a {
//	NSLog(@"</tikz>");
//	NSLog(@"%@", [graph tikz]);
}

- (void)finalize {
//	NSLog(@"releasing subparser trees");
	PKReleaseSubparserTree(nodeParser);
	PKReleaseSubparserTree(edgeParser);
	PKReleaseSubparserTree(tikzPictureParser);
	[super finalize];
}

@end
