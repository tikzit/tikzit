//
//  EdgeStyle.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger. All rights reserved.
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

#import "EdgeStyle.h"

@implementation EdgeStyle

+ (void)initialize {
	[self setKeys:[NSArray arrayWithObjects:
				@"tailStyle",
				@"headStyle",
				@"decorationStyle",
				@"thickness",
				@"name",
				nil]
          triggerChangeNotificationsForDependentKey:@"tikz"];
}

- (id)initWithName:(NSString*)nm {
    self = [super initWithNotificationName:@"EdgeStylePropertyChanged"];

	if (self != nil) {
		headStyle = AH_None;
		tailStyle = AH_None;
		decorationStyle = ED_None;
		name = nm;
		category = nil;
		thickness = 1.0f;
	}

    return self;
}

- (id)init {
	self = [self initWithName:@"new"];
	return self;
}

- (id)copyWithZone:(NSZone*)zone {
	EdgeStyle *style = [[EdgeStyle allocWithZone:zone] init];
	[style setName:[self name]];
	[style setCategory:[self category]];
	[style setHeadStyle:[self headStyle]];
	[style setTailStyle:[self tailStyle]];
	[style setDecorationStyle:[self decorationStyle]];
	[style setThickness:[self thickness]];
	return style;
}

- (void)dealloc {
    [name release];
    [category release];
    [super dealloc];
}

+ (EdgeStyle*)defaultEdgeStyleWithName:(NSString*)nm {
	return [[[EdgeStyle alloc] initWithName:nm] autorelease];
}

- (NSString*)name { return name; }
- (void)setName:(NSString *)s {
	if (name != s) {
		NSString *oldValue = name;
		name = [s copy];
		[self postPropertyChanged:@"name" oldValue:oldValue];
		[oldValue release];
	}
}

- (ArrowHeadStyle)headStyle { return headStyle; }
- (void)setHeadStyle:(ArrowHeadStyle)s {
	ArrowHeadStyle oldValue = headStyle;
	headStyle = s;
	[self postPropertyChanged:@"headStyle" oldValue:[NSNumber numberWithInt:oldValue]];
}

- (ArrowHeadStyle)tailStyle { return tailStyle; }
- (void)setTailStyle:(ArrowHeadStyle)s {
	ArrowHeadStyle oldValue = tailStyle;
	tailStyle = s;
	[self postPropertyChanged:@"tailStyle" oldValue:[NSNumber numberWithInt:oldValue]];
}

- (EdgeDectorationStyle)decorationStyle { return decorationStyle; }
- (void)setDecorationStyle:(EdgeDectorationStyle)s {
	EdgeDectorationStyle oldValue = decorationStyle;
	decorationStyle = s;
	[self postPropertyChanged:@"decorationStyle" oldValue:[NSNumber numberWithInt:oldValue]];
}
- (float)thickness { return thickness; }
- (void)setThickness:(float)s {
	float oldValue = thickness;
	thickness = s;
	[self postPropertyChanged:@"thickness" oldValue:[NSNumber numberWithFloat:oldValue]];
}

- (NSString*)category {
	return category;
}

- (void)setCategory:(NSString *)s {
	if (category != s) {
		NSString *oldValue = category;
		category = [s copy];
		[self postPropertyChanged:@"category" oldValue:oldValue];
		[oldValue release];
	}
}

- (NSString*)tikz {
	NSMutableString *buf = [NSMutableString stringWithFormat:@"\\tikzstyle{%@}=[", name];

	if (tailStyle == AH_Plain)
		[buf appendString:@"<"];
	else if (tailStyle == AH_Latex)
		[buf appendString:@"latex"];

	[buf appendString:@"-"];

	if (headStyle == AH_Plain)
		[buf appendString:@">"];
	else if (headStyle == AH_Latex)
		[buf appendString:@"latex"];

	if (decorationStyle != ED_None) {
		[buf appendString:@",postaction={decorate},decoration={markings,mark="];
		if (decorationStyle == ED_Arrow)
			[buf appendString:@"at position .5 with {\\arrow{>}}"];
		else if (decorationStyle == ED_Tick)
			[buf appendString:@"at position .5 with {\\draw (0,-0.1) -- (0,0.1);}"];
		[buf appendString:@"}"];
	}

	if (thickness != 1.0f) {
		[buf appendFormat:@",line width=%.3f", thickness];
	}

	[buf appendString:@"]"];
	return buf;
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
