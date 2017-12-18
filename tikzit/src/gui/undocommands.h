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

#endif // UNDOCOMMANDS_H
