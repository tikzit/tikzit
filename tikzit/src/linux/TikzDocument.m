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

#import "TikzDocument.h"
#import "TikzGraphAssembler.h"

@interface TikzDocument (Private)
- (void) styleRenamed:(NSNotification*)n;

- (void) setPath:(NSString*)path;
- (void) setGraph:(Graph*)g;

- (void) registerUndoForChange:(GraphChange*)change;
- (void) registerUndoGroupForChange:(GraphChange*)change withName:(NSString*)name;
- (void) undoGraphChange:(GraphChange*)change;
- (void) completedGraphChange:(GraphChange*)change withName:(NSString*)name;
- (void) attachStylesToGraph:(Graph*)g;

- (void) regenerateTikz;
@end

@implementation TikzDocument

+ (TikzDocument*) documentWithStyleManager:(StyleManager*)manager {
    return [[[TikzDocument alloc] initWithStyleManager:manager] autorelease];
}

+ (TikzDocument*) documentWithGraph:(Graph*)g styleManager:(StyleManager*)manager {
    return [[[TikzDocument alloc] initWithGraph:g styleManager:manager] autorelease];
}

+ (TikzDocument*) documentWithTikz:(NSString*)t styleManager:(StyleManager*)manager {
    return [[[TikzDocument alloc] initWithTikz:t styleManager:manager] autorelease];
}

+ (TikzDocument*) documentFromFile:(NSString*)pth styleManager:(StyleManager*)manager error:(NSError**)error {
    return [[[TikzDocument alloc] initFromFile:pth styleManager:manager error:error] autorelease];
}


- (id) initWithStyleManager:(StyleManager*)manager {
    self = [self initWithGraph:[Graph graph] styleManager:manager];
    return self;
}

- (id) initWithGraph:(Graph*)g styleManager:(StyleManager*)manager {
    self = [super init];

    if (self) {
        graph = nil;
        styleManager = [manager retain];
        pickSupport = [[PickSupport alloc] init];
        undoManager = [[NSUndoManager alloc] init];
        [undoManager setGroupsByEvent:NO];
        tikz = nil;
        path = nil;
        nodesetBeingModified = nil;
        nodesetBeingModifiedOldCopy = nil;
        nodeBeingModified = nil;
        nodeBeingModifiedOldCopy = nil;
        edgeBeingModified = nil;
        edgeBeingModifiedOldCopy = nil;

        [undoManager disableUndoRegistration];
        [self setGraph:g];
        [undoManager enableUndoRegistration];

        hasChanges = NO;

	[[NSNotificationCenter defaultCenter]
		addObserver:self
		   selector:@selector(styleRenamed:)
		       name:@"NodeStyleRenamed"
		     object:styleManager];
	[[NSNotificationCenter defaultCenter]
		addObserver:self
		   selector:@selector(styleRenamed:)
		       name:@"EdgeStyleRenamed"
		     object:styleManager];
    }

    return self;
}

- (id) initWithTikz:(NSString*)t styleManager:(StyleManager*)manager {
    self = [self initWithStyleManager:manager];

    if (self) {
        [undoManager disableUndoRegistration];
        [self setTikz:t];
        [undoManager enableUndoRegistration];
        hasChanges = NO;
    }

    return self;
}

- (id) initFromFile:(NSString*)pth styleManager:(StyleManager*)manager error:(NSError**)error {
    NSStringEncoding enc; // we can't pass in NULL here...
    NSString *t = [NSString stringWithContentsOfFile:pth
                            usedEncoding:&enc error:error];
    if (t == nil) {
        [self release];
        return nil;
    }

    self = [self initWithTikz:t styleManager:manager];

    if (self) {
        [self setPath:pth];
    }
    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [styleManager release];
    [graph release];
    [pickSupport release];
    [undoManager release];
    [tikz release];
    [path release];
    [nodesetBeingModified release];
    [nodesetBeingModifiedOldCopy release];
    [nodeBeingModified release];
    [nodeBeingModifiedOldCopy release];
    [edgeBeingModified release];
    [edgeBeingModifiedOldCopy release];
    [oldGraphData release];
    [super dealloc];
}

- (Graph*) graph {
    return graph;
}

- (PickSupport*) pickSupport {
    return pickSupport;
}

- (NSString*) path {
    return path;
}

- (NSString*) name {
    if (path) {
        return [[NSFileManager defaultManager] displayNameAtPath: path];
    } else {
        return @"Untitled";
    }
}

- (NSString*) suggestedFileName {
    if (path) {
        return [path lastPathComponent];
    } else {
        return @"untitled.tikz";
    }
}

- (BOOL) hasUnsavedChanges {
    return hasChanges;
}

- (StyleManager*) styleManager {
    return styleManager;
}

- (void) setStyleManager:(StyleManager*)manager {
    StyleManager *oldManager = styleManager;
    [[NSNotificationCenter defaultCenter]
        removeObserver:self
                  name:nil
                object:oldManager];

    styleManager = [manager retain];

    [[NSNotificationCenter defaultCenter]
            addObserver:self
               selector:@selector(styleRenamed:)
                   name:@"NodeStyleRenamed"
                 object:styleManager];
    [[NSNotificationCenter defaultCenter]
            addObserver:self
               selector:@selector(styleRenamed:)
                   name:@"EdgeStyleRenamed"
                 object:styleManager];

    [self attachStylesToGraph:graph];
    [oldManager release];
}

- (void) postGraphReplaced {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GraphReplaced" object:self];
}

- (void) postGraphChange:(GraphChange*)change {
    NSDictionary *info = [NSDictionary dictionaryWithObject:change forKey:@"change"];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GraphChanged" object:self userInfo:info];
}

- (void) postIncompleteGraphChange:(GraphChange*)change {
    NSDictionary *info = [NSDictionary dictionaryWithObject:change forKey:@"change"];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GraphBeingChanged" object:self userInfo:info];
}

- (void) postCancelledGraphChange:(GraphChange*)change {
    NSDictionary *info = [NSDictionary dictionaryWithObject:change forKey:@"change"];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"GraphChangeCancelled" object:self userInfo:info];
}

- (void) postTikzChanged {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"TikzChanged" object:self];
}

- (void) postParseError {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"ParseError" object:self];
}

- (void) postUndoStackChanged {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"UndoStackChanged" object:self];
}

- (NSString*) tikz {
    return tikz;
}

- (BOOL) setTikz:(NSString*)t {
    if (t == nil) {
        t = [NSString string];
    }
    if (t == tikz || [t isEqual:tikz]) {
        return YES;
    }

    TikzGraphAssembler *a = [TikzGraphAssembler assembler];
    BOOL success = [a parseTikz:t];
    if (success) {
        // setTikz actually generates a graph from the tikz,
        // and generates the final tikz from that
        [self startUndoGroup];
        [self setGraph:[a graph]];
        [self nameAndEndUndoGroup:@"Update tikz"];
    } else {
        [self postParseError];
    }

    return success;
}

- (Graph*) cutSelection {
    Graph *selection = [self copySelection];
    [self startUndoGroup];
    [self removeSelected];
    [self nameAndEndUndoGroup:@"Cut"];
    return selection;
}

- (Graph*) copySelection {
    return [[graph copyOfSubgraphWithNodes:[pickSupport selectedNodes]] autorelease];
}

- (void) paste:(Graph*)g {
    if (g == nil || [[g nodes] count] == 0) {
        // nothing to paste
        return;
    }

    // place to the right of the existing graph
    NSRect bounds = [graph bounds];
    NSRect gBounds = [g bounds];
    float dx = NSMaxX (bounds) - gBounds.origin.x + 0.5f;
    [g shiftNodes:[g nodes] byPoint:NSMakePoint (dx, 0)];

    GraphChange *change = [graph insertGraph:g];
    [self completedGraphChange:change withName:@"Paste"];

    // select everything from the clipboard
    [pickSupport deselectAllEdges];
    [pickSupport selectAllNodes:[g nodes] replacingSelection:YES];
}

- (void) pasteFromTikz:(NSString*)t {
    TikzGraphAssembler *a = [TikzGraphAssembler assembler];
    if ([a parseTikz:t]) {
        Graph *clipboard = [a graph];
        [self attachStylesToGraph:clipboard];
        [self paste:clipboard];
    }
}

- (BOOL) isNodeSelected:(Node*)node {
    return [pickSupport isNodeSelected:node];
}

- (BOOL) isEdgeSelected:(Edge*)edge {
    return [pickSupport isEdgeSelected:edge];
}

- (NSEnumerator*) nodeEnumerator {
    return [[graph nodes] objectEnumerator];
}

- (NSEnumerator*) edgeEnumerator {
    return [[graph edges] objectEnumerator];
}

- (BOOL) canUndo {
    return [undoManager canUndo];
}

- (void) undo {
    [undoManager undo];
    [self postUndoStackChanged];
}

- (BOOL) canRedo {
    return [undoManager canRedo];
}

- (void) redo {
    [undoManager redo];
    [self postUndoStackChanged];
}

- (NSString*) undoName {
    return [undoManager undoActionName];
}

- (NSString*) redoName {
    return [undoManager redoActionName];
}

- (void) startUndoGroup {
    [undoManager beginUndoGrouping];
}

- (void) nameAndEndUndoGroup:(NSString*)nm {
    [undoManager setActionName:nm];
    [undoManager endUndoGrouping];
    [self postUndoStackChanged];
}

- (void) endUndoGroup {
    [undoManager endUndoGrouping];
    [self postUndoStackChanged];
}

- (void) startModifyNode:(Node*)node {
    if (nodeBeingModified != nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Already modifying a node"];
    }
    nodeBeingModified = [node retain];
    nodeBeingModifiedOldCopy = [node copy];
}

- (void) modifyNodeCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange propertyChangeOfNode:nodeBeingModified
                                       fromOld:nodeBeingModifiedOldCopy
                                       toNew:[[nodeBeingModified copy] autorelease]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishModifySequence:(GraphChange*)change withName:(NSString*)chName cancelled:(BOOL)cancelled {
    if (cancelled) {
        change = [change invert];
        [graph applyGraphChange:change];
        [self regenerateTikz];
        [self postCancelledGraphChange:change];
    } else {
        [self registerUndoGroupForChange:change withName:chName];
        [self regenerateTikz];
        [self postGraphChange:change];
    }
}

- (void) _finishModifyNodeCancelled:(BOOL)cancelled {
    if (nodeBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying a node"];
    }

    GraphChange *change = [GraphChange propertyChangeOfNode:nodeBeingModified
                                       fromOld:nodeBeingModifiedOldCopy
                                       toNew:[[nodeBeingModified copy] autorelease]];
    [self _finishModifySequence:change withName:@"Modify node" cancelled:cancelled];

    [nodeBeingModified release];
    nodeBeingModified = nil;
    [nodeBeingModifiedOldCopy release];
    nodeBeingModifiedOldCopy = nil;
}

- (void) endModifyNode { [self _finishModifyNodeCancelled:NO]; }
- (void) cancelModifyNode { [self _finishModifyNodeCancelled:YES]; }

- (void) startModifyNodes:(NSSet*)nodes {
    if (nodesetBeingModified != nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Already modifying a node set"];
    }

    nodesetBeingModified = [nodes copy];
    nodesetBeingModifiedOldCopy = [[Graph nodeTableForNodes:nodes] retain];
}

- (void) modifyNodesCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange propertyChangeOfNodesFromOldCopies:nodesetBeingModifiedOldCopy
                                       toNewCopies:[Graph nodeTableForNodes:nodesetBeingModified]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishModifyNodes:(BOOL)cancelled {
    if (nodesetBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying a node set"];
    }

    GraphChange *change = [GraphChange propertyChangeOfNodesFromOldCopies:nodesetBeingModifiedOldCopy
                                       toNewCopies:[Graph nodeTableForNodes:nodesetBeingModified]];
    [self _finishModifySequence:change withName:@"Modify nodes" cancelled:cancelled];

    [nodesetBeingModified release];
    nodesetBeingModified = nil;
    [nodesetBeingModifiedOldCopy release];
    nodesetBeingModifiedOldCopy = nil;
}

- (void) endModifyNodes { [self _finishModifyNodes:NO]; }
- (void) cancelModifyNodes { [self _finishModifyNodes:YES]; }

- (void) startShiftNodes:(NSSet*)nodes {
    if (nodesetBeingModified != nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Already modifying a node set"];
    }

    nodesetBeingModified = [nodes copy];
    currentNodeShift = NSZeroPoint;
}

- (void) shiftNodesUpdate:(NSPoint)currentShift {
    if (nodesetBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying a node set"];
    }

    currentNodeShift = currentShift;
    [self regenerateTikz];
    GraphChange *change = [GraphChange shiftNodes:nodesetBeingModified
                                       byPoint:currentNodeShift];
    [self postIncompleteGraphChange:change];
}

- (void) _finishShiftNodesCancelled:(BOOL)cancelled {
    if (nodesetBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying a node set"];
    }

    if (!NSEqualPoints (currentNodeShift, NSZeroPoint)) {
        GraphChange *change = [GraphChange shiftNodes:nodesetBeingModified
                                           byPoint:currentNodeShift];
        [self _finishModifySequence:change withName:@"Move nodes" cancelled:cancelled];
    }

    [nodesetBeingModified release];
    nodesetBeingModified = nil;
}

- (void) endShiftNodes { [self _finishShiftNodesCancelled:NO]; }
- (void) cancelShiftNodes { [self _finishShiftNodesCancelled:YES]; }

- (void) startModifyEdge:(Edge*)edge {
    if (edgeBeingModified != nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Already modifying an edge"];
    }
    edgeBeingModified = [edge retain];
    edgeBeingModifiedOldCopy = [edge copy];
}

- (void) modifyEdgeCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange propertyChangeOfEdge:edgeBeingModified
                                       fromOld:edgeBeingModifiedOldCopy
                                       toNew:[[edgeBeingModified copy] autorelease]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishModifyEdgeCancelled:(BOOL)cancelled {
    if (edgeBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying an edge"];
    }

    GraphChange *change = [GraphChange propertyChangeOfEdge:edgeBeingModified
                                       fromOld:edgeBeingModifiedOldCopy
                                       toNew:[[edgeBeingModified copy] autorelease]];
    [self _finishModifySequence:change withName:@"Modify edge" cancelled:cancelled];

    [edgeBeingModified release];
    edgeBeingModified = nil;
    [edgeBeingModifiedOldCopy release];
    edgeBeingModifiedOldCopy = nil;
}

- (void) endModifyEdge { [self _finishModifyEdgeCancelled:NO]; }
- (void) cancelModifyEdge { [self _finishModifyEdgeCancelled:YES]; }

- (void) startModifyEdges:(NSSet*)edges {
    if (edgesetBeingModified != nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Already modifying an edge set"];
    }

    edgesetBeingModified = [edges copy];
    edgesetBeingModifiedOldCopy = [[Graph edgeTableForEdges:edges] retain];
}

- (void) modifyEdgesCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange propertyChangeOfEdgesFromOldCopies:edgesetBeingModifiedOldCopy
                                       toNewCopies:[Graph edgeTableForEdges:edgesetBeingModified]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishModifyEdgesCancelled:(BOOL)cancelled {
    if (edgesetBeingModified == nil) {
        [NSException raise:@"NSInternalInconsistencyException" format:@"Not modifying an edge"];
    }

    GraphChange *change = [GraphChange propertyChangeOfEdgesFromOldCopies:edgesetBeingModifiedOldCopy
                                       toNewCopies:[Graph edgeTableForEdges:edgesetBeingModified]];
    [self _finishModifySequence:change withName:@"Modify edges" cancelled:cancelled];

    [edgesetBeingModified release];
    edgesetBeingModified = nil;
    [edgesetBeingModifiedOldCopy release];
    edgesetBeingModifiedOldCopy = nil;
}

- (void) endModifyEdges { [self _finishModifyEdgesCancelled:NO]; }
- (void) cancelModifyEdges { [self _finishModifyEdgesCancelled:YES]; }

- (void) startChangeBoundingBox {
    oldGraphBounds = [graph boundingBox];
}

- (void) changeBoundingBoxCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange changeBoundingBoxFrom:oldGraphBounds
                                       to:[graph boundingBox]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishChangeBoundingBoxCancelled:(BOOL)cancelled {
    GraphChange *change = [GraphChange changeBoundingBoxFrom:oldGraphBounds
                                       to:[graph boundingBox]];
    [self _finishModifySequence:change withName:@"Set bounding box" cancelled:cancelled];
}
- (void) endChangeBoundingBox { [self _finishChangeBoundingBoxCancelled:NO]; }
- (void) cancelChangeBoundingBox { [self _finishChangeBoundingBoxCancelled:YES]; }

- (void) startChangeGraphProperties {
    oldGraphData = [[graph data] copy];
}

- (void) changeGraphPropertiesCheckPoint {
    [self regenerateTikz];
    GraphChange *change = [GraphChange propertyChangeOfGraphFrom:oldGraphData
                                       to:[graph data]];
    [self postIncompleteGraphChange:change];
}

- (void) _finishChangeGraphPropertiesCancelled:(BOOL)cancelled {
    GraphChange *change = [GraphChange propertyChangeOfGraphFrom:oldGraphData
                                       to:[graph data]];
    [self _finishModifySequence:change withName:@"Change graph properties" cancelled:cancelled];
    [oldGraphData release];
    oldGraphData = nil;
}
- (void) endChangeGraphProperties { [self _finishChangeGraphPropertiesCancelled:NO]; }
- (void) cancelChangeGraphProperties { [self _finishChangeGraphPropertiesCancelled:YES]; }

- (void) removeSelected {
    NSUInteger selEdges = [[pickSupport selectedEdges] count];
    NSUInteger selNodes = [[pickSupport selectedNodes] count];

    if (selEdges == 0 && selNodes == 0) {
        return;
    }

    NSString *actionName = @"Remove selection";

    [self startUndoGroup];
    if (selEdges > 0) {
        GraphChange *change = [graph removeEdges:[pickSupport selectedEdges]];
        [self registerUndoForChange:change];
        [pickSupport deselectAllEdges];
        [self postGraphChange:change];
    } else {
        actionName = (selNodes == 1 ? @"Remove node" : @"Remove nodes");
    }
    if (selNodes > 0) {
        GraphChange *change = [graph removeNodes:[pickSupport selectedNodes]];
        [self registerUndoForChange:change];
        [pickSupport deselectAllNodes];
        [self postGraphChange:change];
    } else {
        actionName = (selEdges == 1 ? @"Remove edge" : @"Remove edges");
    }
    [self nameAndEndUndoGroup:actionName];
    [self regenerateTikz];
}

- (void) addNode:(Node*)node {
    GraphChange *change = [graph addNode:node];
    [self completedGraphChange:change withName:@"Add node"];
}

- (Node*) addNodeAt:(NSPoint)pos {
    Node *node = [Node nodeWithPoint:pos];
    [node setStyle:[styleManager activeNodeStyle]];
    [self addNode:node];
    return node;
}

- (void) removeNode:(Node*)node {
    [pickSupport deselectNode:node];
    GraphChange *change = [graph removeNode:node];
    [self completedGraphChange:change withName:@"Remove node"];
}

- (void) addEdge:(Edge*)edge {
    GraphChange *change = [graph addEdge:edge];
    [self completedGraphChange:change withName:@"Add edge"];
}

- (void) removeEdge:(Edge*)edge {
    [pickSupport deselectEdge:edge];
    GraphChange *change = [graph removeEdge:edge];
    [self completedGraphChange:change withName:@"Remove edge"];
}

- (Edge*) addEdgeFrom:(Node*)source to:(Node*)target {
    Edge *edge = [Edge edgeWithSource:source andTarget:target];
    [edge setStyle:[styleManager activeEdgeStyle]];
    [self addEdge:edge];
    return edge;
}

- (void) shiftSelectedNodesByPoint:(NSPoint)offset {
    if ([[pickSupport selectedNodes] count] > 0) {
        GraphChange *change = [graph shiftNodes:[pickSupport selectedNodes] byPoint:offset];
        [self completedGraphChange:change withName:@"Move nodes"];
    }
}

- (void) insertGraph:(Graph*)g {
    GraphChange *change = [graph insertGraph:g];
    [self completedGraphChange:change withName:@"Insert graph"];
}

- (void) flipSelectedNodesHorizontally {
    if ([[pickSupport selectedNodes] count] > 0) {
        GraphChange *change = [graph flipHorizontalNodes:[pickSupport selectedNodes]];
        [self completedGraphChange:change withName:@"Flip nodes horizontally"];
    }
}

- (void) flipSelectedNodesVertically {
    if ([[pickSupport selectedNodes] count] > 0) {
        GraphChange *change = [graph flipVerticalNodes:[pickSupport selectedNodes]];
        [self completedGraphChange:change withName:@"Flip nodes vertically"];
    }
}

- (BOOL) saveCopyToPath: (NSString*)p error: (NSError**)error {
    if (!p) {
        [NSException raise:@"No document path" format:@"No path given"];
    }
    // we use glib for writing the file, because GNUStep sucks in this regard
    // (older versions don't have -[NSString writeToFile:atomically:encoding:error:])
    GError *gerror = NULL;
    gchar *filename = [p glibFilename];
    BOOL success = g_file_set_contents (filename, [tikz UTF8String], -1, &gerror) ? YES : NO;
    if (gerror) {
        GErrorToNSError (gerror, error);
        g_error_free (gerror);
    }
    g_free (filename);
    return success;
}

- (BOOL) saveToPath: (NSString*)p error: (NSError**)error {
    BOOL success = [self saveCopyToPath:p error:error];
    if (success) {
        [self setPath:p];
        hasChanges = NO;
    }
    return success;
}

- (BOOL) save: (NSError**)error {
    if (!path) {
        [NSException raise:@"No document path" format:@"Tried to save a document when there was no path"];
    }
    return [self saveToPath:path error:error];
}

@end

@implementation TikzDocument (Private)
- (void) styleRenamed:(NSNotification*)n {
    [self regenerateTikz];
}

- (void) setPath:(NSString*)p {
    [p retain];
    [path release];
    path = p;
}

- (void) setGraph:(Graph*)g {
    if (g == nil) {
        g = [Graph graph];
    }
    if (g == graph) {
        return;
    }

    [pickSupport deselectAllNodes];
    [pickSupport deselectAllEdges];

    [self startUndoGroup];
    [undoManager registerUndoWithTarget:self selector:@selector(setGraph:) object:graph];
    [g retain];
    [graph release];
    graph = g;

    [self attachStylesToGraph:graph];

    [self regenerateTikz];
    [self postGraphReplaced];
    [self nameAndEndUndoGroup:@"Replace graph"];
}

- (void) registerUndoForChange:(GraphChange*)change {
    [undoManager registerUndoWithTarget:self
                 selector:@selector(undoGraphChange:)
                 object:change];
}

- (void) registerUndoGroupForChange:(GraphChange*)change withName:(NSString*)nm {
    [self startUndoGroup];
    [self registerUndoForChange:change];
    [self nameAndEndUndoGroup:nm];
}

- (void) undoGraphChange:(GraphChange*)change {
    GraphChange *inverse = [change invert];
    [graph applyGraphChange:inverse];
    [self startUndoGroup];
    [undoManager registerUndoWithTarget:self
                 selector:@selector(undoGraphChange:)
                 object:inverse];
    [self endUndoGroup];
    [self regenerateTikz];
    [self postGraphChange:change];
}

- (void) completedGraphChange:(GraphChange*)change withName:(NSString*)name {
    [self registerUndoGroupForChange:change withName:name];
    [self regenerateTikz];
    [self postGraphChange:change];
}

- (void) attachStylesToGraph:(Graph*)g {
    for (Node *n in [g nodes]) {
        [n attachStyleFromTable:[styleManager nodeStyles]];
    }
}

- (void) regenerateTikz {
    [tikz release];
    tikz = [[graph tikz] retain];
    hasChanges = YES;
    [self postTikzChanged];
}
@end

// vim:ft=objc:sts=4:sw=4:et
