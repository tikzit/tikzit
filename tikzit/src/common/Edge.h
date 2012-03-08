//
//  Edge.h
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


// Edge : store the data associated with an edge. Also, lazily compute
// bezier curve control points based on bend and the coordinates of 
// the endpoints.

#import "Node.h"
#import "EdgeStyle.h"

/*!
 @typedef    enum EdgeBendMode
 @brief      Indicates the type of edge bend.
 @var        EdgeBendModeBasic A basic, one-angle bend. Positive values will be interpreted
             as bend left, negative as bend right.
 @var        EdgeBendModeInOut A two-angle bend mode, using inAngle and outAngle.
 */
typedef enum {
	EdgeBendModeBasic,
	EdgeBendModeInOut
} EdgeBendMode;

/*!
 @class      Edge
 @brief      A graph edge, with associated bend and style data.
 @details    A graph edge, with associated bend and style data. This class
             also contains methods for computing the bezier control points
             and the midpoint of the curve.
 */
@interface Edge : NSObject<NSCopying> {
	Node *source;
	Node *target;
	Node *edgeNode;
	int bend;
	int inAngle, outAngle;
	EdgeBendMode bendMode;
	float weight;
    EdgeStyle *style;
	GraphElementData *data;
	
    // When set to YES, lazily create the edge node, and keep it around when set
    // to NO (at least until saved/loaded).
    BOOL hasEdgeNode;
	BOOL dirty;
	
	// these are all cached values computed from the above
	NSPoint src;
	NSPoint targ;
	NSPoint head;
	NSPoint tail;
	NSPoint cp1;
	NSPoint cp2;
	NSPoint mid;
    NSPoint midTan;
    NSPoint headTan;
    NSPoint tailTan;
}

/*!
 @property   data
 @brief      Associated edge data.
 */
@property (copy) GraphElementData *data;

/*!
 @property   style
 @brief      Edge style.
 */
@property (retain) EdgeStyle *style;

/*!
 @property   source
 @brief      Source node.
 */
@property (retain) Node *source;

/*!
 @property   target
 @brief      Target node.
 */
@property (retain) Node *target;

/*!
 @property   edgeNode
 @brief      A node attached to this edge, as in a label or tick.
 */
@property (retain) Node *edgeNode;

/*!
 @property   hasEdgeNode
 @brief      A read/write property. When set to true, a new edge node is actually constructed.
*/
@property (assign) BOOL hasEdgeNode;

/*!
 @property   bend
 @brief      The degrees by which the edge bends.
 */
@property (assign) int bend;

/*!
 @property   weight
 @brief      How close the edge will pass to control points.
 */
@property (assign) float weight;

/*!
 @property   inAngle
 @brief      The angle by which the edge enters its target.
 */
@property (assign) int inAngle;

/*!
 @property   outAngle
 @brief      The angle by which the edge leaves its target.
 */
@property (assign) int outAngle;

/*!
 @property   bendMode
 @brief      The mode of the edge bend. Either simple bend in in/out style.
 */
@property (assign) EdgeBendMode bendMode;

/*!
 @property   head
 @brief      The starting point of the edge.
 @detail     This value is computed based on the source, target and
             either bend or in/out angles.  It is where the edge
			 makes contact with the source node.
 */
@property (readonly) NSPoint head;

/*!
 @property   tail
 @brief      The ending point of the edge.
 @detail     This value is computed based on the source, target and
             either bend or in/out angles.  It is where the edge
			 makes contact with the target node.
 */
@property (readonly) NSPoint tail;

/*!
 @property   cp1
 @brief      The first control point of the edge.
 @detail     This value is computed based on the source, target and
             either bend or in/out angles.
 */
@property (readonly) NSPoint cp1;

/*!
 @property   cp2
 @brief      The second control point of the edge.
 @detail     This value is computed based on the source, target and
             either bend or in/out angles.
 */
@property (readonly) NSPoint cp2;

/*!
 @property   mid
 @brief      The midpoint of the curve. Computed from the source, target, and control points.
 */
@property (readonly) NSPoint mid;

/*!
 @property   mid_tan
 @brief      The second point of a line tangent to the midpoint. (The first is the midpoint itself.)
 */
@property (readonly) NSPoint midTan;

/*!
 @property   left_normal
 @brief      The second point in a line perp. to the edge coming from mid-point. (left side)
 */
@property (readonly) NSPoint leftNormal;

/*!
 @property   left_normal
 @brief      The second point in a line perp. to the edge coming from mid-point. (right side)
 */
@property (readonly) NSPoint rightNormal;

/*!
 @property   leftHeadNormal
 */
@property (readonly) NSPoint leftHeadNormal;

/*!
 @property   rightHeadNormal
 */
@property (readonly) NSPoint rightHeadNormal;

/*!
 @property   leftTailNormal
 */
@property (readonly) NSPoint leftTailNormal;

/*!
 @property   rightTailNormal
 */
@property (readonly) NSPoint rightTailNormal;

/*!
 @property   isSelfLoop
 @brief      Returns YES if this edge is a self loop.
 */
@property (readonly) BOOL isSelfLoop;

/*!
 @property   isStraight
 @brief      Returns YES if this edge can be drawn as a straight line (as opposed to a bezier curve).
 */
@property (readonly) BOOL isStraight;


/*!
 @brief      Construct a blank edge.
 @result     An edge.
 */
- (id)init;

/*!
 @brief      Construct an edge with the given source and target.
 @param      s the source node.
 @param      t the target node.
 @result     An edge.
 */
- (id)initWithSource:(Node*)s andTarget:(Node*)t;

/*!
 @brief      Recompute the control points and midpoint.
 */
- (void)updateControls;

/*!
 @brief      Push edge properties back into its <tt>GraphElementData</tt>.
 */
- (void)updateData;

/*!
 @brief      Set edge properties from fields in <tt>GraphElementData</tt>.
 */
- (void)setAttributesFromData;

/*!
 @brief      Use data.style to find and attach the <tt>EdgeStyle</tt> object from the given array.
 */
- (BOOL)attachStyleFromTable:(NSArray*)styles;

/*!
 @brief      Convert the bend angle to an inAngle and outAngle.
 */
- (void)convertBendToAngles;

/*!
 @brief      Set the bend angle to the average of the in and out angles.
 */
- (void)convertAnglesToBend;

/*!
 @brief      Update this edge to look just like the given edge.
 @param      e an edge to mimic.
 */
- (void)setPropertiesFromEdge:(Edge *)e;

/*!
 @brief      Get a bounding rect for this edge.
 @detail     Note that this may not be a tight bound.
 */
- (NSRect)boundingRect;

/*!
 @brief      Moves the first control point, updating edge properties as necessary
 @detail     This will move a control point and adjust the weight and
             bend (or outAngle) to fit.

             A courseness can be specified for both the weight and the
             bend, allowing them to be constrained to certain values.  For
             example, passing 10 as the bend courseness will force the bend
             to be a multiple of 5.  Passing 0 for either of these will
             cause the relevant value to be unconstrained.
 @param      point  the new position of the control point
 @param      wc  force the weight to be a multiple of this value (unless 0)
 @param      bc  force the bend (or outAngle) to be a multiple of this value (unless 0)
 @param      link  when in EdgeBendModeInOut, change both the in and out angles at once
 */
- (void) moveCp1To:(NSPoint)point withWeightCourseness:(float)wc andBendCourseness:(int)bc forceLinkControlPoints:(BOOL)link;

/*!
 @brief      Moves the first control point, updating edge properties as necessary
 @detail     This will move a control point and adjust the weight and
             bend (or outAngle) to fit.

             The same as moveCp1To:point withWeightCourseness:0.0f andBendCourseness:0 forceLinkControlPoints:No
 @param      point  the new position of the control point
 @param      wc  force the weight to be a multiple of this value (unless 0)
 @param      bc  force the bend (or outAngle) to be a multiple of this value (unless 0)
 @param      link  when in EdgeBendModeInOut, change both the in and out angles at once
 */
- (void) moveCp1To:(NSPoint)point;

/*!
 @brief      Moves the first control point, updating edge properties as necessary
 @detail     This will move a control point and adjust the weight and
             bend (or inAngle) to fit.

             A courseness can be specified for both the weight and the
             bend, allowing them to be constrained to certain values.  For
             example, passing 10 as the bend courseness will force the bend
             to be a multiple of 5.  Passing 0 for either of these will
             cause the relevant value to be unconstrained.
 @param      point  the new position of the control point
 @param      wc  force the weight to be a multiple of this value (unless 0)
 @param      bc  force the bend (or inAngle) to be a multiple of this value (unless 0)
 @param      link  when in EdgeBendModeInOut, change both the in and out angles at once
 */
- (void) moveCp2To:(NSPoint)point withWeightCourseness:(float)wc andBendCourseness:(int)bc forceLinkControlPoints:(BOOL)link;

/*!
 @brief      Moves the first control point, updating edge properties as necessary
 @detail     This will move a control point and adjust the weight and
             bend (or inAngle) to fit.

             The same as moveCp2To:point withWeightCourseness:0.0f andBendCourseness:0 forceLinkControlPoints:No
 @param      point  the new position of the control point
 */
- (void) moveCp2To:(NSPoint)point;

/*!
 @brief      Reverse edge direction, updating bend/inAngle/outAngle/etc
 */
- (void)reverse;

/*!
 @brief      Factory method to make a blank edge.
 @result     An edge.
 */
+ (Edge*)edge;

/*!
 @brief      Factory method to make an edge with the given source and target.
 @param      s a source node.
 @param      t a target node.
 @result     An edge.
 */
+ (Edge*)edgeWithSource:(Node*)s andTarget:(Node*)t;

@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
