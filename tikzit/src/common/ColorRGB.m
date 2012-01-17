//
//  ColorRGB.m
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

#import "ColorRGB.h"
#import "util.h"

typedef struct {
	NSString *name;
	unsigned short r, g, b;
} ColorRGBEntry;

static const ColorRGBEntry kColors[147] = {
	{ @"AliceBlue",               240, 248, 255 },
	{ @"AntiqueWhite",            250, 235, 215 },
	{ @"Aqua",                      0, 255, 255 },
	{ @"Aquamarine",              127, 255, 212 },
	{ @"Azure",                   240, 255, 255 },
	{ @"Beige",                   245, 245, 220 },
	{ @"Bisque",                  255, 228, 196 },
	{ @"Black",                     0,   0,   0 },
	{ @"BlanchedAlmond",          255, 235, 205 },
	{ @"Blue",                      0,   0, 255 },
	{ @"BlueViolet",              138,  43, 226 },
	{ @"Brown",                   165,  42,  42 },
	{ @"BurlyWood",               222, 184, 135 },
	{ @"CadetBlue",                95, 158, 160 },
	{ @"Chartreuse",              127, 255,   0 },
	{ @"Chocolate",               210, 105,  30 },
	{ @"Coral",                   255, 127,  80 },
	{ @"CornflowerBlue",          100, 149, 237 },
	{ @"Cornsilk",                255, 248, 220 },
	{ @"Crimson",                 220,  20,  60 },
	{ @"Cyan",                      0, 255, 255 },
	{ @"DarkBlue",                  0,   0, 139 },
	{ @"DarkCyan",                  0, 139, 139 },
	{ @"DarkGoldenrod",           184, 134,  11 },
	{ @"DarkGray",                169, 169, 169 },
	{ @"DarkGreen",                 0, 100,   0 },
	{ @"DarkGrey",                169, 169, 169 },
	{ @"DarkKhaki",               189, 183, 107 },
	{ @"DarkMagenta",             139,   0, 139 },
	{ @"DarkOliveGreen",           85, 107,  47 },
	{ @"DarkOrange",              255, 140,   0 },
	{ @"DarkOrchid",              153,  50, 204 },
	{ @"DarkRed",                 139,   0,   0 },
	{ @"DarkSalmon",              233, 150, 122 },
	{ @"DarkSeaGreen",            143, 188, 143 },
	{ @"DarkSlateBlue",            72,  61, 139 },
	{ @"DarkSlateGray",            47,  79,  79 },
	{ @"DarkSlateGrey",            47,  79,  79 },
	{ @"DarkTurquoise",             0, 206, 209 },
	{ @"DarkViolet",              148,   0, 211 },
	{ @"DeepPink",                255,  20, 147 },
	{ @"DeepSkyBlue",               0, 191, 255 },
	{ @"DimGray",                 105, 105, 105 },
	{ @"DimGrey",                 105, 105, 105 },
	{ @"DodgerBlue",               30, 144, 255 },
	{ @"FireBrick",               178,  34,  34 },
	{ @"FloralWhite",             255, 250, 240 },
	{ @"ForestGreen",              34, 139,  34 },
	{ @"Fuchsia",                 255,   0, 255 },
	{ @"Gainsboro",               220, 220, 220 },
	{ @"GhostWhite",              248, 248, 255 },
	{ @"Gold",                    255, 215,   0 },
	{ @"Goldenrod",               218, 165,  32 },
	{ @"Gray",                    128, 128, 128 },
	{ @"Grey",                    128, 128, 128 },
	{ @"Green",                     0, 128,   0 },
	{ @"GreenYellow",             173, 255,  47 },
	{ @"Honeydew",                240, 255, 240 },
	{ @"HotPink",                 255, 105, 180 },
	{ @"IndianRed",               205,  92,  92 },
	{ @"Indigo",                   75,   0, 130 },
	{ @"Ivory",                   255, 255, 240 },
	{ @"Khaki",                   240, 230, 140 },
	{ @"Lavender",                230, 230, 250 },
	{ @"LavenderBlush",           255, 240, 245 },
	{ @"LawnGreen",               124, 252,   0 },
	{ @"LemonChiffon",            255, 250, 205 },
	{ @"LightBlue",               173, 216, 230 },
	{ @"LightCoral",              240, 128, 128 },
	{ @"LightCyan",               224, 255, 255 },
	{ @"LightGoldenrodYellow",    250, 250, 210 },
	{ @"LightGray",               211, 211, 211 },
	{ @"LightGreen",              144, 238, 144 },
	{ @"LightGrey",               211, 211, 211 },
	{ @"LightPink",               255, 182, 193 },
	{ @"LightSalmon",             255, 160, 122 },
	{ @"LightSeaGreen",            32, 178, 170 },
	{ @"LightSkyBlue",            135, 206, 250 },
	{ @"LightSlateGray",          119, 136, 153 },
	{ @"LightSlateGrey",          119, 136, 153 },
	{ @"LightSteelBlue",          176, 196, 222 },
	{ @"LightYellow",             255, 255, 224 },
	{ @"Lime",                      0, 255,   0 },
	{ @"LimeGreen",                50, 205,  50 },
	{ @"Linen",                   250, 240, 230 },
	{ @"Magenta",                 255,   0, 255 },
	{ @"Maroon",                  128,   0,   0 },
	{ @"MediumAquamarine",        102, 205, 170 },
	{ @"MediumBlue",                0,   0, 205 },
	{ @"MediumOrchid",            186,  85, 211 },
	{ @"MediumPurple",            147, 112, 219 },
	{ @"MediumSeaGreen",           60, 179, 113 },
	{ @"MediumSlateBlue",         123, 104, 238 },
	{ @"MediumSpringGreen",         0, 250, 154 },
	{ @"MediumTurquoise",          72, 209, 204 },
	{ @"MediumVioletRed",         199,  21, 133 },
	{ @"MidnightBlue",             25,  25, 112 },
	{ @"MintCream",               245, 255, 250 },
	{ @"MistyRose",               255, 228, 225 },
	{ @"Moccasin",                255, 228, 181 },
	{ @"NavajoWhite",             255, 222, 173 },
	{ @"Navy",                      0,   0, 128 },
	{ @"OldLace",                 253, 245, 230 },
	{ @"Olive",                   128, 128,   0 },
	{ @"OliveDrab",               107, 142,  35 },
	{ @"Orange",                  255, 165,   0 },
	{ @"OrangeRed",               255,  69,   0 },
	{ @"Orchid",                  218, 112, 214 },
	{ @"PaleGoldenrod",           238, 232, 170 },
	{ @"PaleGreen",               152, 251, 152 },
	{ @"PaleTurquoise",           175, 238, 238 },
	{ @"PaleVioletRed",           219, 112, 147 },
	{ @"PapayaWhip",              255, 239, 213 },
	{ @"PeachPuff",               255, 218, 185 },
	{ @"Peru",                    205, 133,  63 },
	{ @"Pink",                    255, 192, 203 },
	{ @"Plum",                    221, 160, 221 },
	{ @"PowderBlue",              176, 224, 230 },
	{ @"Purple",                  128,   0, 128 },
	{ @"Red",                     255,   0,   0 },
	{ @"RosyBrown",               188, 143, 143 },
	{ @"RoyalBlue",                65, 105, 225 },
	{ @"SaddleBrown",             139,  69,  19 },
	{ @"Salmon",                  250, 128, 114 },
	{ @"SandyBrown",              244, 164,  96 },
	{ @"SeaGreen",                 46, 139,  87 },
	{ @"Seashell",                255, 245, 238 },
	{ @"Sienna",                  160,  82,  45 },
	{ @"Silver",                  192, 192, 192 },
	{ @"SkyBlue",                 135, 206, 235 },
	{ @"SlateBlue",               106,  90, 205 },
	{ @"SlateGray",               112, 128, 144 },
	{ @"SlateGrey",               112, 128, 144 },
	{ @"Snow",                    255, 250, 250 },
	{ @"SpringGreen",               0, 255, 127 },
	{ @"SteelBlue",                70, 130, 180 },
	{ @"Tan",                     210, 180, 140 },
	{ @"Teal",                      0, 128, 128 },
	{ @"Thistle",                 216, 191, 216 },
	{ @"Tomato",                  255,  99,  71 },
	{ @"Turquoise",                64, 224, 208 },
	{ @"Violet",                  238, 130, 238 },
	{ @"Wheat",                   245, 222, 179 },
	{ @"White",                   255, 255, 255 },
	{ @"WhiteSmoke",              245, 245, 245 },
	{ @"Yellow",                  255, 255,   0 },
	{ @"YellowGreen",             154, 205,  50 }
};

static NSMapTable *colorHash = nil; 

@implementation ColorRGB

- (unsigned short)red { return red; }
- (void)setRed:(unsigned short)r { red = r; }
- (unsigned short)green { return green; }
- (void)setGreen:(unsigned short)g { green = g; }
- (unsigned short)blue { return blue; }
- (void)setBlue:(unsigned short)b { blue = b; }

- (float)redFloat { return ((float)red)/255.0f; }
- (void)setRedFloat:(float)r { red = round(r*255.0f); }
- (float)greenFloat { return ((float)green)/255.0f; }
- (void)setGreenFloat:(float)g { green = round(g*255.0f); }
- (float)blueFloat { return ((float)blue)/255.0f; }
- (void)setBlueFloat:(float)b { blue = round(b*255.0f); }

- (int)hash {
	return (red<<4) + (green<<2) + blue;
}

- (id)initWithRed:(unsigned short)r green:(unsigned short)g blue:(unsigned short)b {
	[super init];
	red = r;
	green = g;
	blue = b;
	return self;
}

- (id)initWithFloatRed:(float)r green:(float)g blue:(float)b {
	[super init];
	red = round(r*255.0f);
	green = round(g*255.0f);
	blue = round(b*255.0f);
	return self;
}

- (id) initWithRColor:(RColor)color {
    return [self initWithFloatRed:color.red green:color.green blue:color.blue];
}

- (RColor) rColor {
    return MakeSolidRColor ([self redFloat], [self greenFloat], [self blueFloat]);
}

- (RColor) rColorWithAlpha:(CGFloat)alpha {
    return MakeRColor ([self redFloat], [self greenFloat], [self blueFloat], alpha);
}

- (NSString*)name {
	if (colorHash == nil) [ColorRGB makeColorHash];
	return [colorHash objectForKey:self];
}

- (NSString*)hexName {
	return [NSString stringWithFormat:@"hexcolor0x%.2x%.2x%.2x", red, green, blue];
}

- (NSComparisonResult)compare:(ColorRGB*)col {
	if (red > [col red]) return NSOrderedDescending;
	else if (red < [col red]) return NSOrderedAscending;
	else {
		if (green > [col green]) return NSOrderedDescending;
		else if (green < [col green]) return NSOrderedAscending;
		else {
			if (blue > [col blue]) return NSOrderedDescending;
			else if (blue < [col blue]) return NSOrderedAscending;
			else return NSOrderedSame;
		}
	}
}

- (BOOL)isEqual:(id)col {
	return [self compare:col] == NSOrderedSame;
}

- (float)distanceFromColor:(ColorRGB *)col {
	float dr = (float)(red - [col red]);
	float dg = (float)(green - [col green]);
	float db = (float)(blue - [col blue]);
	return dr*dr + dg*dg + db*db;
}

- (id)copy {
	ColorRGB *col = [[ColorRGB alloc] initWithRed:red green:green blue:blue];
	return col;
}

+ (ColorRGB*)colorWithRed:(unsigned short)r green:(unsigned short)g blue:(unsigned short)b {
	ColorRGB *col = [[ColorRGB alloc] initWithRed:r green:g blue:b];
	return [col autorelease];
}


+ (ColorRGB*)colorWithFloatRed:(float)r green:(float)g blue:(float)b {
	ColorRGB *col = [[ColorRGB alloc] initWithFloatRed:r green:g blue:b];
	return [col autorelease];
}

+ (ColorRGB*) colorWithRColor:(RColor)color {
    return [[[self alloc] initWithRColor:color] autorelease];
}

+ (void)makeColorHash {
	NSMapTable *h = [[NSMapTable alloc] init];
	int i;
	for (i = 0; i < 147; ++i) {
		ColorRGB *col = [[ColorRGB alloc] initWithRed:kColors[i].r
												green:kColors[i].g
												 blue:kColors[i].b];
		[h setObject:kColors[i].name forKey:col];
		//NSLog(@"adding color %@ (%d)", kColors[i].name, [col hash]);
		[col release];
	}
	colorHash = h;
}

+ (void)releaseColorHash {
	[colorHash release];
}

- (void)setToClosestHashed {
	if (colorHash == nil)
		[ColorRGB makeColorHash];
	float bestDist = -1;
	ColorRGB *bestColor = nil;
	NSEnumerator *enumerator = [colorHash keyEnumerator];
	ColorRGB *tryColor;
	while ((tryColor = [enumerator nextObject]) != nil) {
		float dist = [self distanceFromColor:tryColor];
		if (bestDist<0 || dist<bestDist) {
			bestDist = dist;
			bestColor = tryColor;
		}
	}
	[self setRed:[bestColor red]];
	[self setGreen:[bestColor green]];
	[self setBlue:[bestColor blue]];
}

@end

// vi:noet:ts=4:sts=4:sw=4
