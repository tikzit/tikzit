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

EdgeBendCommand::EdgeBendCommand(TikzScene *scene, Edge *edge,
                                 float oldWeight, int oldBend,
                                 int oldInAngle, int oldOutAngle) :
    _scene(scene), _edge(edge),
    _oldWeight(oldWeight), _oldBend(oldBend),
    _oldInAngle(oldInAngle), _oldOutAngle(oldOutAngle)
{
    _newWeight = edge->weight();
    _newBend = edge->bend();
    _newInAngle = edge->inAngle();
    _newOutAngle = edge->outAngle();
}

void EdgeBendCommand::undo()
{
    _edge->setWeight(_oldWeight);
    _edge->setBend(_oldBend);
    _edge->setInAngle(_oldInAngle);
    _edge->setOutAngle(_oldOutAngle);

    foreach(EdgeItem *ei, _scene->edgeItems()) {
        if (ei->edge() == _edge) {
            ei->readPos();
            break;
        }
    }
}

void EdgeBendCommand::redo()
{
    _edge->setWeight(_newWeight);
    _edge->setBend(_newBend);
    _edge->setInAngle(_newInAngle);
    _edge->setOutAngle(_newOutAngle);

    foreach(EdgeItem *ei, _scene->edgeItems()) {
        if (ei->edge() == _edge) {
            ei->readPos();
            break;
        }
    }
}
