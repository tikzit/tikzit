//
//  parser.m
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
#import "test/test.h"
#import "TikzGraphAssembler.h"


#ifdef STAND_ALONE
void runTests() {
#else
void testParser() {
#endif
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"parser");
	
	[TikzGraphAssembler setup];
	
	NodeStyle *rn = [NodeStyle defaultNodeStyleWithName:@"rn"];
	NSArray *styles = [NSArray arrayWithObject:rn];
	
	NSString *tikz =
	@"\\begin{tikzpicture}[dotpic]"
	@" \\begin{pgfonlayer}{foo}"   //ignored
	@"  \\node [style=rn] (0) at (-2,3.4) {stuff{$\\alpha$ in here}};"
	@"  \\node (b) at (1,1) {};"
	@" \\end{pgfonlayer}"          //ignored
	@"  \\draw [bend right=20] (0) to node[tick]{-} (b.center);"
	@"\\end{tikzpicture}";
	
	TikzGraphAssembler *ga = [[TikzGraphAssembler alloc] init];
	TEST(@"Parsing TikZ", [ga parseTikz:tikz]);
	
	Graph *g = [ga graph];
	TEST(@"Graph is non-nil", g != nil);
	TEST(@"Graph has correct number of nodes", [[g nodes] count]==2);
	TEST(@"Graph has correct number of edges", [[g edges] count]==1);
	
	NSEnumerator *en = [[g nodes] objectEnumerator];
	Node *n;
	Node *n1, *n2;
	while ((n=[en nextObject])) {
		[n attachStyleFromTable:styles];
		if ([n style] == rn) n1 = n;
		else if ([n style] == nil) n2 = n;
	}
	
	TEST(@"Styles attached correctly", n1!=nil && n2!=nil);
	
	TEST(@"Nodes labeled correctly",
		 [[n1 label] isEqualToString:@"stuff{$\\alpha$ in here}"] &&
		 [[n2 label] isEqualToString:@""]
	);
	
	Edge *e1 = [[[g edges] objectEnumerator] nextObject];
	
	TEST(@"Edge has edge node", [e1 edgeNode]!=nil);
	TEST(@"Edge node labeled correctly", [[[e1 edgeNode] label] isEqualToString:@"-"]);
//	NSString *sty = [[[[[e1 edgeNode] data] atoms] objectEnumerator] nextObject];
//	TEST(@"Edge node styled correctly", sty!=nil && [sty isEqualToString:@"tick"]);
    
    PUTS(@"Source anchor: %@",[e1 sourceAnchor]);
    PUTS(@"Target anchor: %@",[e1 targetAnchor]);
    
	endTestBlock(@"parser");
	
	[pool drain];
}
