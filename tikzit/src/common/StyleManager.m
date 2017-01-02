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
#if __has_feature(objc_arc)
    return [[self alloc] init];
#else
    return [[[self alloc] init] autorelease];
#endif
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
#if ! __has_feature(objc_arc)
	[nodeStyles release];
	[edgeStyles release];

	[super dealloc];
#endif
}

- (void) loadDefaultEdgeStyles {
#if ! __has_feature(objc_arc)
	[edgeStyles release];
#endif
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
#if ! __has_feature(objc_arc)
	[nodeStyles release];
#endif
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
#if ! __has_feature(objc_arc)
    [nodeStyles release];
    [styles retain];
#endif
    nodeStyles = styles;
	for (NodeStyle *style in styles) {
		[self listenToNodeStyle:style];
	}
    [self postNodeStylesReplaced];
}

- (void) _setEdgeStyles:(NSMutableArray*)styles {
	[self ignoreAllEdgeStyles];
#if ! __has_feature(objc_arc)
    [edgeStyles release];
    [styles retain];
#endif
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
#if ! __has_feature(objc_arc)
    [style retain];
#endif
    [nodeStyles removeObject:style];
    [self postNodeStyleRemoved:style];
#if ! __has_feature(objc_arc)
    [style release];
#endif
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
#if ! __has_feature(objc_arc)
    [style retain];
#endif
    [edgeStyles removeObject:style];
    [self postEdgeStyleRemoved:style];
#if ! __has_feature(objc_arc)
    [style release];
#endif
}

- (void) updateFromManager:(StyleManager*)m {
	NSMutableArray *ns = [NSMutableArray arrayWithCapacity:[[m nodeStyles] count]];
	for (NodeStyle *style in [m nodeStyles]) {
		NodeStyle *currentStyle = [self nodeStyleForName:[style name]];
		if (currentStyle != nil) {
			[currentStyle updateFromStyle:style];
			[ns addObject:currentStyle];
		} else {
#if __has_feature(objc_arc)
            [ns addObject:[style copy]];
#else
			[ns addObject:[[style copy] autorelease]];
#endif
		}
	}
	NSMutableArray *es = [NSMutableArray arrayWithCapacity:[[m edgeStyles] count]];
	for (EdgeStyle *style in [m edgeStyles]) {
		EdgeStyle *currentStyle = [self edgeStyleForName:[style name]];
		if (currentStyle != nil) {
			[currentStyle updateFromStyle:style];
			[es addObject:currentStyle];
		} else {
#if __has_feature(objc_arc)
            [es addObject:[style copy]];
#else
            [es addObject:[[style copy] autorelease]];
#endif		
        }
	}
	[self _setNodeStyles:ns];
	[self _setEdgeStyles:es];
}

- (id) copyWithZone:(NSZone*)zone {
	StyleManager *m = [[StyleManager allocWithZone:zone] init];

	NSMutableArray *ns = [NSMutableArray arrayWithCapacity:[nodeStyles count]];
	for (NodeStyle *style in nodeStyles) {
#if __has_feature(objc_arc)
        [ns addObject:[style copyWithZone:zone]];
#else
        [ns addObject:[[style copyWithZone:zone] autorelease]];
#endif
	}
	NSMutableArray *es = [NSMutableArray arrayWithCapacity:[edgeStyles count]];
	for (EdgeStyle *style in edgeStyles) {
#if __has_feature(objc_arc)
        [es addObject:[style copyWithZone:zone]];
#else
        [es addObject:[[style copyWithZone:zone] autorelease]];
#endif
	}
	[m _setNodeStyles:ns];
	[m _setEdgeStyles:es];

	return m;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
