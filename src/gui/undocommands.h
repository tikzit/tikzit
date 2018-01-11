/*!
  * \file undocommands.h
  *
  * All changes to a TikzDocument are done via subclasses of QUndoCommand. When a controller
  * (e.g. TikzScene) gets input from the user to change the document, it will push one of
  * these commands onto the TikzDocument's undo stack, which automatically calls the redo()
  * method of the command.
  */

#ifndef UNDOCOMMANDS_H
#define UNDOCOMMANDS_H

#include "tikzscene.h"

#include <QUndoCommand>

class MoveCommand : public QUndoCommand
{
public:
    explicit MoveCommand(TikzScene *scene,
                         QMap<Node*,QPointF> oldNodePositions,
                         QMap<Node*,QPointF> newNodePositions,
                         QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    TikzScene *_scene;
    QMap<Node*,QPointF> _oldNodePositions;
    QMap<Node*,QPointF> _newNodePositions;
};

class EdgeBendCommand : public QUndoCommand
{
public:
    explicit EdgeBendCommand(TikzScene *scene, Edge *edge,
                             float oldWeight, int oldBend,
                             int oldInAngle, int oldOutAngle);
    void undo() override;
    void redo() override;
private:
    TikzScene *_scene;
    Edge *_edge;
    float _oldWeight;
    int _oldBend;
    int _oldInAngle;
    int _oldOutAngle;
    float _newWeight;
    int _newBend;
    int _newInAngle;
    int _newOutAngle;
};

class DeleteCommand : public QUndoCommand
{
public:
    explicit DeleteCommand(TikzScene *scene,
                           QMap<int,Node*> deleteNodes,
                           QMap<int,Edge*> deleteEdges,
                           QSet<Edge*> selEdges);
    void undo() override;
    void redo() override;
private:
    TikzScene *_scene;
    QMap<int,Node*> _deleteNodes;
    QMap<int,Edge*> _deleteEdges;
    QSet<Edge*> _selEdges;
};

class AddNodeCommand : public QUndoCommand
{
public:
    explicit AddNodeCommand(TikzScene *scene, Node *node, QRectF newBounds);
    void undo() override;
    void redo() override;
private:
    TikzScene *_scene;
    Node *_node;
    QRectF _oldBounds;
    QRectF _newBounds;
};

#endif // UNDOCOMMANDS_H
