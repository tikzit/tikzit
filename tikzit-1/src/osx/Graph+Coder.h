//
//  Graph+Coder.h
//  TikZiT
//
//  Created by Aleks Kissinger on 27/04/2010.
//  Copyright 2010 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Graph.h"

@interface Graph (Coder)

- (id)initWithCoder:(NSCoder*)coder;
- (void)encodeWithCoder:(NSCoder*)coder;

@end
