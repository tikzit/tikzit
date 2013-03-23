//
//  Graph+Coder.m
//  TikZiT
//
//  Created by Aleks Kissinger on 27/04/2010.
//  Copyright 2010 __MyCompanyName__. All rights reserved.
//

#import "Graph+Coder.h"
#import "TikzGraphAssembler.h"

@implementation Graph(Coder)

- (id)initWithCoder:(NSCoder*)coder {
	NSString *tikz = [coder decodeObject];
        [TikzGraphAssembler parseTikz:tikz forGraph:self];
	return self;
}

- (void)encodeWithCoder:(NSCoder*)coder {
	[coder encodeObject:[self tikz]];
}

@end
