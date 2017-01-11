//
//  EdgeStyle.h
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

#import <Foundation/Foundation.h>
#import "PropertyHolder.h"
#import "ColorRGB.h"

typedef enum {
	AH_None = 0,
    AH_Plain = 1,
    AH_Latex = 2
} ArrowHeadStyle;

typedef enum {
    ED_None = 0,
    ED_Arrow = 1,
    ED_Tick = 2
} EdgeDectorationStyle;

@interface EdgeStyle : PropertyHolder <NSCopying> {
    ArrowHeadStyle headStyle, tailStyle;
    EdgeDectorationStyle decorationStyle;
    float thickness;
	ColorRGB *colorRGB;
    NSString *name;
    NSString *category;
}

/*!
 @property   colorRGB
 @brief      The color to render the line in
 */
@property (copy) ColorRGB *colorRGB;

@property (copy) NSString *name;
@property (copy) NSString *category;
@property (assign) ArrowHeadStyle headStyle;
@property (assign) ArrowHeadStyle tailStyle;
@property (assign) EdgeDectorationStyle decorationStyle;
@property (assign) float thickness;

@property (readonly) NSString *tikz;

- (id)init;
- (id)initWithName:(NSString*)nm;
+ (EdgeStyle*)defaultEdgeStyleWithName:(NSString*)nm;
- (void) updateFromStyle:(EdgeStyle*)style;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
