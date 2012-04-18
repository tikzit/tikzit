//
//  NodeStyle.h
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

#import "util.h"
#import "ColorRGB.h"
#import "PropertyHolder.h"

/*!
 @class      NodeStyle
 @brief      Store node style information.
 @details    Store node style information. These properties affect how a node
             is displayed in TikZiT. Colors are stored in the ColorRGB struct
             to avoid any Cocoa dependency. These styles should be persistant,
             which should be implemented in a platform-specific category. For
             OS X, this is NodeStyle+Coder.
 */
@interface NodeStyle : PropertyHolder <NSCopying> {
	int strokeThickness;
	float scale;
	ColorRGB *strokeColorRGB;
	ColorRGB *fillColorRGB;
	NSString *name;
	NSString *shapeName;
	NSString *category;
}

/*!
 @property   strokeThickness
 @brief      Thickness of the stroke.
 */
@property (assign) int strokeThickness;

/*!
 @property   scale
 @brief      Overall scale of the shape. Defaults to 1.0.
 */
@property (assign) float scale;


/*!
 @property   strokeColorRGB
 @brief      The stroke color used to render the node
 */
@property (copy) ColorRGB *strokeColorRGB;

/*!
 @property   fillColorRGB
 @brief      The fill color used to render the node
 */
@property (copy) ColorRGB *fillColorRGB;

/*!
 @property   name
 @brief      Style name.
 @details    Style name. This is the only thing that affects how the node
             will look when the latex code is rendered.
 */
@property (copy) NSString *name;

/*!
 @property   shapeName
 @brief      The name of the shape that will be drawn in TikZiT.
 */
@property (copy) NSString *shapeName;

/*!
 @property   category
 @brief      ???
 */
@property (copy) NSString *category;

@property (readonly) NSString *tikz;
@property (readonly) BOOL strokeColorIsKnown;
@property (readonly) BOOL fillColorIsKnown;

+ (int) defaultStrokeThickness;

/*!
 @brief      Designated initializer. Construct a blank style with name 'new'.
 @result     A default style.
 */
- (id)init;

/*!
 @brief      Create a named style.
 @param      nm the style name.
 @result     A <tt>NodeStyle</tt> with the given name.
 */
- (id)initWithName:(NSString *)nm;

/*!
 @brief      Factory method for initWithName:
 @param      nm the style name.
 @result     A <tt>NodeStyle</tt> with the given name.
 */
+ (NodeStyle*)defaultNodeStyleWithName:(NSString *)nm;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
