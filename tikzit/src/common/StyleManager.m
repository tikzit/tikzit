/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
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

#import "StyleManager.h"

@implementation StyleManager

- (void) nodeStylePropertyChanged:(NSNotification*)n {
	if ([[[n userInfo] objectForKey:@"propertyName"] isEqual:@"name"]) {
		NSDictionary *userInfo;
        userInfo = [NSDictionary dictionaryWithObjectsAndKeys:
                    [n object], @"style",
                    [[n userInfo] objectForKey:@"oldValue"], @"oldName",
                    nil];
		[[NSNotificationCenter defaultCenter] postNotificationName:@"NodeStyleRenamed"
															object:self
														  userInfo:userInfo];
	}
}

- (void) ignoreAllNodeStyles {
	[[NSNotificationCenter defaultCenter]
		removeObserver:self
		          name:@"NodeStylePropertyChanged"
		        object:nil];
}

- (void) ignoreNodeStyle:(NodeStyle*)style {
	[[NSNotificationCenter defaultCenter]
		removeObserver:self
		          name:@"NodeStylePropertyChanged"
		        object:style];
}

- (void) listenToNodeStyle:(NodeStyle*)style {
	[[NSNotificationCenter defaultCenter]
		addObserver:self
		   selector:@selector(nodeStylePropertyChanged:)
		       name:@"NodeStylePropertyChanged"
		     object:style];
}

- (void) edgeStylePropertyChanged:(NSNotification*)n {
	if ([[[n userInfo] objectForKey:@"propertyName"] isEqual:@"name"]) {
		NSDictionary *userInfo;
        userInfo = [NSDictionary dictionaryWithObjectsAndKeys:
                    [n object], @"style",
                    [[n userInfo] objectForKey:@"oldValue"], @"oldName",
                    nil];
		[[NSNotificationCenter defaultCenter] postNotificationName:@"EdgeStyleRenamed"
															object:self
														  userInfo:userInfo];
	}
}

- (void) ignoreAllEdgeStyles {
	[[NSNotificationCenter defaultCenter]
		removeObserver:self
		          name:@"EdgeStylePropertyChanged"
		        object:nil];
}

- (void) ignoreEdgeStyle:(EdgeStyle*)style {
	[[NSNotificationCenter defaultCenter]
		removeObserver:self
		          name:@"EdgeStylePropertyChanged"
		        object:style];
}

- (void) listenToEdgeStyle:(EdgeStyle*)style {
	[[NSNotificationCenter defaultCenter]
		addObserver:self
		   selector:@selector(edgeStylePropertyChanged:)
		       name:@"EdgeStylePropertyChanged"
		     object:style];
}

+ (StyleManager*) manager {
    return [[[self alloc] init] autorelease];
}

- (id) init {
    self = [super init];

    if (self) {
        // we lazily load the default styles, since they may not be needed
        nodeStyles = nil;
        edgeStyles = nil;
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

	[nodeStyles release];
	[edgeStyles release];

	[super dealloc];
}

- (void) loadDefaultEdgeStyles {
	[edgeStyles release];
	edgeStyles = [[NSMutableArray alloc] initWithCapacity:3];

	EdgeStyle *simple = [EdgeStyle defaultEdgeStyleWithName:@"simple"];
	[simple setThickness:2.0f];
	[self listenToEdgeStyle:simple];

	EdgeStyle *arrow = [EdgeStyle defaultEdgeStyleWithName:@"arrow"];
	[arrow setThickness:2.0f];
	[arrow setDecorationStyle:ED_Arrow];
	[self listenToEdgeStyle:arrow];

	EdgeStyle *tick = [EdgeStyle defaultEdgeStyleWithName:@"tick"];
	[tick setThickness:2.0f];
	[tick setDecorationStyle:ED_Tick];
	[self listenToEdgeStyle:tick];

	[edgeStyles addObject:simple];
	[edgeStyles addObject:arrow];
	[edgeStyles addObject:tick];
}

- (void) loadDefaultNodeStyles {
	[nodeStyles release];
    nodeStyles = [[NSMutableArray alloc] initWithCapacity:3];

    NodeStyle *rn = [NodeStyle defaultNodeStyleWithName:@"rn"];
    [rn setStrokeThickness:2];
    [rn setStrokeColorRGB:[ColorRGB colorWithFloatRed:0 green:0 blue:0]];
    [rn setFillColorRGB:[ColorRGB colorWithFloatRed:1 green:0 blue:0]];
	[self listenToNodeStyle:rn];

    NodeStyle *gn = [NodeStyle defaultNodeStyleWithName:@"gn"];
    [gn setStrokeThickness:2];
    [gn setStrokeColorRGB:[ColorRGB colorWithFloatRed:0 green:0 blue:0]];
    [gn setFillColorRGB:[ColorRGB colorWithFloatRed:0 green:1 blue:0]];
	[self listenToNodeStyle:gn];

    NodeStyle *yn = [NodeStyle defaultNodeStyleWithName:@"yn"];
    [yn setStrokeThickness:2];
    [yn setStrokeColorRGB:[ColorRGB colorWithFloatRed:0 green:0 blue:0]];
    [yn setFillColorRGB:[ColorRGB colorWithFloatRed:1 green:1 blue:0]];
	[self listenToNodeStyle:yn];

    [nodeStyles addObject:rn];
    [nodeStyles addObject:gn];
    [nodeStyles addObject:yn];
}

- (void) postNodeStyleAdded:(NodeStyle*)style {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"NodeStyleAdded"
                                                        object:self
                                                      userInfo:[NSDictionary dictionaryWithObject:style forKey:@"style"]];
}

- (void) postNodeStyleRemoved:(NodeStyle*)style {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"NodeStyleRemoved"
                                                        object:self
                                                      userInfo:[NSDictionary dictionaryWithObject:style forKey:@"style"]];
}

- (void) postEdgeStyleAdded:(EdgeStyle*)style {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EdgeStyleAdded"
                                                        object:self
                                                      userInfo:[NSDictionary dictionaryWithObject:style forKey:@"style"]];
}

- (void) postEdgeStyleRemoved:(EdgeStyle*)style {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EdgeStyleRemoved"
                                                        object:self
                                                      userInfo:[NSDictionary dictionaryWithObject:style forKey:@"style"]];
}

- (void) postNodeStylesReplaced {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"NodeStylesReplaced" object:self];
}

- (void) postEdgeStylesReplaced {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EdgeStylesReplaced" object:self];
}

- (NSArray*) nodeStyles {
    if (nodeStyles == nil) {
        [self loadDefaultNodeStyles];
    }
    return nodeStyles;
}

- (NSArray*) edgeStyles {
    if (edgeStyles == nil) {
        [self loadDefaultEdgeStyles];
    }
    return edgeStyles;
}

- (void) _setNodeStyles:(NSMutableArray*)styles {
	[self ignoreAllNodeStyles];
    [nodeStyles release];
    [styles retain];
    nodeStyles = styles;
	for (NodeStyle *style in styles) {
		[self listenToNodeStyle:style];
	}
    [self postNodeStylesReplaced];
}

- (void) _setEdgeStyles:(NSMutableArray*)styles {
	[self ignoreAllEdgeStyles];
    [edgeStyles release];
    [styles retain];
    edgeStyles = styles;
	for (EdgeStyle *style in styles) {
		[self listenToEdgeStyle:style];
	}
    [self postEdgeStylesReplaced];
}

- (NodeStyle*) nodeStyleForName:(NSString*)name {
	for (NodeStyle *s in nodeStyles) {
        if ([[s name] isEqualToString:name]) {
            return s;
        }
    }

    return nil;
}

- (void) addNodeStyle:(NodeStyle*)style {
    if (nodeStyles == nil) {
        [self loadDefaultNodeStyles];
    }
    [nodeStyles addObject:style];
	[self listenToNodeStyle:style];
    [self postNodeStyleAdded:style];
}

- (void) removeNodeStyle:(NodeStyle*)style {
    if (nodeStyles == nil) {
        [self loadDefaultNodeStyles];
    }

	[self ignoreNodeStyle:style];
    [style retain];
    [nodeStyles removeObject:style];
    [self postNodeStyleRemoved:style];
    [style release];
}

- (EdgeStyle*) edgeStyleForName:(NSString*)name {
	for (EdgeStyle *s in edgeStyles) {
        if ([[s name] isEqualToString:name]) {
            return s;
        }
    }

    return nil;
}

- (void) addEdgeStyle:(EdgeStyle*)style {
    if (edgeStyles == nil) {
        [self loadDefaultEdgeStyles];
    }
    [edgeStyles addObject:style];
	[self listenToEdgeStyle:style];
    [self postEdgeStyleAdded:style];
}

- (void) removeEdgeStyle:(EdgeStyle*)style {
    if (edgeStyles == nil) {
        [self loadDefaultEdgeStyles];
    }

	[self ignoreEdgeStyle:style];
    [style retain];
    [edgeStyles removeObject:style];
    [self postEdgeStyleRemoved:style];
    [style release];
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
