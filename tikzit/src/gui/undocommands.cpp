#include "undocommands.h"

MoveCommand::MoveCommand(TikzScene *scene,
                         QMap<Node*, QPointF> oldNodePositions,
                         QMap<Node*, QPointF> newNodePositions,
                         QUndoCommand *parent) :
    QUndoCommand(parent),
    _scene(scene),
    _oldNodePositions(oldNodePositions),
    _newNodePositions(newNodePositions)
{
}


void MoveCommand::undo()
{
    foreach (NodeItem *ni, _scene->nodeItems()) {
        if (_oldNodePositions.contains(ni->node())) {
            ni->node()->setPoint(_oldNodePositions.value(ni->node()));
            ni->readPos();
        }
    }

    _scene->refreshAdjacentEdges(_oldNodePositions.keys());
}

void MoveCommand::redo()
{
    foreach (NodeItem *ni, _scene->nodeItems()) {
        if (_newNodePositions.contains(ni->node())) {
            ni->node()->setPoint(_newNodePositions.value(ni->node()));
            ni->readPos();
        }
    }

    _scene->refreshAdjacentEdges(_newNodePositions.keys());
}
