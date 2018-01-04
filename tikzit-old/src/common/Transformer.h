//
//  Transformer.h
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

extern float const PIXELS_PER_UNIT;

/*!
 @class      Transformer
 @brief      Do affine coordinate transforms between an abstract co-ordinate
             space (such as the graph's) and the screen's.

	     This currently allows zooming and panning.
 */
@interface Transformer : NSObject <NSCopying> {
	NSPoint origin;
	float x_scale;
    float y_scale;
}

/*!
 @brief      The screen co-ordinate of the abstract space origin.
 */
@property (assign) NSPoint origin;

/*!
 @brief      The scale (from abstract space to screen space)
 @detail     This is the size of a single unit (a distance of 1.0)
             of the abstract space on the screen.

             Around 50 is a reasonable value.
 */
@property (assign) float scale;

/*!
 @brief      Whether co-ordinates are flipped about the X axis
 @detail     TikZ considers X co-ordinates to run left to right,
             which is not necessarily how the screen views
             them.
 */
@property (assign,getter=isFlippedAboutXAxis) BOOL flippedAboutXAxis;

/*!
 @brief      Whether co-ordinates are flipped about the Y axis
 @detail     TikZ considers Y co-ordinates to run up the page,
             which is not necessarily how the screen views
             them.
 */
@property (assign,getter=isFlippedAboutYAxis) BOOL flippedAboutYAxis;

/*!
 @brief      Transform a point from screen space to abstract space.
 @param      p a point in screen space.
 @result     A point in abstract space.
 */
- (NSPoint)fromScreen:(NSPoint)p;

/*!
 @brief      Transform a point from abstract space to screen space.
 @param      p a point in abstract space.
 @result     A point in screen space.
 */
- (NSPoint)toScreen:(NSPoint)p;

/*!
 @brief      Scale a distance from screen space to abstract space.
 @param      dist a distance in screen space.
 @result     A distance in abstract space.
 */
- (float)scaleFromScreen:(float)dist;

/*!
 @brief      Scale a distance from abstract space to screen space.
 @param      dist a distance in abstract space.
 @result     A distance in screen space.
 */
- (float)scaleToScreen:(float)dist;

/*!
 @brief      Scale a rectangle from screen space to abstract space.
 @param      r a rectangle in screen space.
 @result     A rectangle in abstract space.
 */
- (NSRect)rectFromScreen:(NSRect)r;

/*!
 @brief      Scale a rectangle from abstract space to screen space.
 @param      r a rectangle in abstract space.
 @result     A rectangle in screen space.
 */
- (NSRect)rectToScreen:(NSRect)r;

/*!
 @brief      Factory method to get an identity transformer.
 @result     A transformer.
 */
+ (Transformer*)transformer;

/*!
 @brief      Factory method to get a transformer identical to another
 @result     A transformer.
 */
+ (Transformer*)transformerWithTransformer:(Transformer*)t;

/*!
 @brief       Factory method to get a transformer.
 @param o     The screen co-ordinate of the abstract space origin
 @param scale The scale (from abstract space to screen space)
 @result      A transformer.
 */
+ (Transformer*)transformerWithOrigin:(NSPoint)o andScale:(float)scale;

/*!
 @brief      Get a global 'actual size' transformer.
 @result     A transformer.
 */
+ (Transformer*)defaultTransformer;

/*!
 @brief       A transformer set up from two bounding rects.

              graphRect is made as large as possible while still fitting into screenRect.
 @result      A transformer.
 */
+ (Transformer*)transformerToFit:(NSRect)graphRect intoScreenRect:(NSRect)screenRect flippedAboutXAxis:(BOOL)flipX flippedAboutYAxis:(BOOL)flipY;

+ (Transformer*)transformerToFit:(NSRect)graphRect intoScreenRect:(NSRect)screenRect flippedAboutXAxis:(BOOL)flipX;
+ (Transformer*)transformerToFit:(NSRect)graphRect intoScreenRect:(NSRect)screenRect flippedAboutYAxis:(BOOL)flipY;
+ (Transformer*)transformerToFit:(NSRect)graphRect intoScreenRect:(NSRect)screenRect;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
