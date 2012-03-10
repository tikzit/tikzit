//
//  TikzDocument.h
//  TikZiT
//
//  Copyright 2010 Chris Heunen
//  Copyright 2010 Alex Merry
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

#import "TZFoundation.h"
#import <Graph.h>
#import "PickSupport.h"
#import "StyleManager.h"

@interface TikzDocument : NSObject {
    StyleManager *styleManager;
    Graph *graph;
    PickSupport *pickSupport;
    NSUndoManager *undoManager;
    NSString *tikz;
    NSString *path;
    NSSet *nodesetBeingModified;
    NSMapTable *nodesetBeingModifiedOldCopy;
    NSSet *edgesetBeingModified;
    NSMapTable *edgesetBeingModifiedOldCopy;
    NSPoint currentNodeShift;
    Node *nodeBeingModified;
    Node *nodeBeingModifiedOldCopy;
    Edge *edgeBeingModified;
    Edge *edgeBeingModifiedOldCopy;
    NSRect oldGraphBounds;
    GraphElementData *oldGraphData;
    BOOL hasChanges;
}

+ (TikzDocument*) documentWithStyleManager:(StyleManager*)manager;
+ (TikzDocument*) documentWithGraph:(Graph*)g styleManager:(StyleManager*)manager;
+ (TikzDocument*) documentWithTikz:(NSString*)t styleManager:(StyleManager*)manager error:(NSError**)error;
+ (TikzDocument*) documentFromFile:(NSString*)path styleManager:(StyleManager*)manager error:(NSError**)error;

- (id) initWithStyleManager:(StyleManager*)manager;
- (id) initWithGraph:(Graph*)g styleManager:(StyleManager*)manager;
- (id) initWithTikz:(NSString*)t styleManager:(StyleManager*)manager error:(NSError**)error;
- (id) initFromFile:(NSString*)path styleManager:(StyleManager*)manager error:(NSError**)error;

@property (readonly) Graph *graph;
@property (readonly) PickSupport *pickSupport;
@property (readonly) NSString *path;
@property (readonly) NSString *name;
@property (readonly) NSString *suggestedFileName;
@property (readonly) BOOL hasUnsavedChanges;
@property (retain)   StyleManager *styleManager;
@property (readonly) NSString *tikz;
@property (readonly) BOOL canUndo;
@property (readonly) BOOL canRedo;
@property (readonly) NSString *undoName;
@property (readonly) NSString *redoName;

- (BOOL) validateTikz:(NSString**)tikz error:(NSError**)error;
- (BOOL) updateTikz:(NSString*)t error:(NSError**)error;

- (Graph*) cutSelection;
- (Graph*) copySelection;
- (void) paste:(Graph*)graph;
- (void) pasteFromTikz:(NSString*)tikz;

// some convenience methods:
- (BOOL) isNodeSelected:(Node*)node;
- (BOOL) isEdgeSelected:(Edge*)edge;
- (NSEnumerator*) nodeEnumerator;
- (NSEnumerator*) edgeEnumerator;

- (void) undo;
- (void) redo;

- (void) startUndoGroup;
- (void) nameAndEndUndoGroup:(NSString*)nm;
- (void) endUndoGroup;

- (void) startModifyNode:(Node*)node;
- (void) modifyNodeCheckPoint;
- (void) endModifyNode;
- (void) cancelModifyNode;

- (void) startModifyNodes:(NSSet*)nodes;
- (void) modifyNodesCheckPoint;
- (void) endModifyNodes;
- (void) cancelModifyNodes;

- (void) startShiftNodes:(NSSet*)nodes;
- (void) shiftNodesUpdate:(NSPoint)shiftChange;
- (void) endShiftNodes;
- (void) cancelShiftNodes;

- (void) startModifyEdge:(Edge*)edge;
- (void) modifyEdgeCheckPoint;
- (void) endModifyEdge;
- (void) cancelModifyEdge;

- (void) startModifyEdges:(NSSet*)edges;
- (void) modifyEdgesCheckPoint;
- (void) endModifyEdges;
- (void) cancelModifyEdges;

- (void) startChangeBoundingBox;
- (void) changeBoundingBoxCheckPoint;
- (void) endChangeBoundingBox;
- (void) cancelChangeBoundingBox;

- (void) startChangeGraphProperties;
- (void) changeGraphPropertiesCheckPoint;
- (void) endChangeGraphProperties;
- (void) cancelChangeGraphProperties;

- (void) removeSelected;
- (void) addNode:(Node*)node;
/*!
 * Convenience function to add a node in the active style
 * at the given point.
 *
 * @param pos  the position (in graph co-ordinates) of the new node
 * @return     the added node
 */
- (Node*) addNodeAt:(NSPoint)pos;
- (void) removeNode:(Node*)node;
- (void) addEdge:(Edge*)edge;
- (void) removeEdge:(Edge*)edge;
/*!
 * Convenience function to add an edge in the active style
 * between the given nodes.
 *
 * @param source  the source node
 * @param target  the target node
 * @return     the added edge
 */
- (Edge*) addEdgeFrom:(Node*)source to:(Node*)target;
- (void) shiftSelectedNodesByPoint:(NSPoint)offset;
- (void) insertGraph:(Graph*)g;
- (void) flipSelectedNodesHorizontally;
- (void) flipSelectedNodesVertically;
- (void) bringSelectionForward;
- (void) bringSelectionToFront;
- (void) sendSelectionBackward;
- (void) sendSelectionToBack;

- (BOOL) saveCopyToPath: (NSString*)path error: (NSError**)error;
- (BOOL) saveToPath: (NSString*)path error: (NSError**)error;
- (BOOL) save: (NSError**)error;

@end

// vim:ft=objc:sts=4:sw=4:et
