/**
  * These classes store the data required to undo/redo a single UI action.
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

#endif // UNDOCOMMANDS_H
