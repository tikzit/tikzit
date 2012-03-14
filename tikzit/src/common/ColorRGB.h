//
//  ColorRGB.h
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

#import <Foundation/Foundation.h>
#import "RColor.h"

@interface ColorRGB : NSObject<NSCopying> {
	unsigned short red, green, blue;
}

@property (assign) unsigned short red;
@property (assign) unsigned short green;
@property (assign) unsigned short blue;

@property (assign) float redFloat;
@property (assign) float greenFloat;
@property (assign) float blueFloat;

@property (readonly) NSString *name;

- (RColor)rColor;
- (RColor)rColorWithAlpha:(CGFloat)alpha;

- (NSString*)hexName;
- (BOOL)isEqual:(id)col;
- (float)distanceFromColor:(ColorRGB*)col;
- (int)hash;

- (id)initWithRed:(unsigned short)r green:(unsigned short)g blue:(unsigned short)b;
- (id)initWithFloatRed:(float)r green:(float)g blue:(float)b;
- (id)initWithRColor:(RColor)color;

- (void)setToClosestHashed;

+ (ColorRGB*)colorWithRed:(unsigned short)r green:(unsigned short)g blue:(unsigned short)b;
+ (ColorRGB*)colorWithFloatRed:(float)r green:(float)g blue:(float)b;
+ (ColorRGB*)colorWithRColor:(RColor)color;

+ (void)makeColorHash;
+ (void)releaseColorHash;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
