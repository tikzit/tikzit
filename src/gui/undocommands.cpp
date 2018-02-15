#include "undocommands.h"
#include "nodeitem.h"
#include "edgeitem.h"

#include <QGraphicsView>

MoveCommand::MoveCommand(TikzScene *scene,
                         QMap<Node*, QPointF> oldNodePositions,
                         QMap<Node*, QPointF> newNodePositions,
                         QUndoCommand *parent) :
    QUndoCommand(parent),
    _scene(scene),
    _oldNodePositions(oldNodePositions),
    _newNodePositions(newNodePositions)
{}


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

DeleteCommand::DeleteCommand(TikzScene *scene,
                             QMap<int, Node *> deleteNodes,
                             QMap<int, Edge *> deleteEdges,
                             QSet<Edge *> selEdges) :
    _scene(scene), _deleteNodes(deleteNodes),
    _deleteEdges(deleteEdges), _selEdges(selEdges)
{}

void DeleteCommand::undo()
{
    for (auto it = _deleteNodes.begin(); it != _deleteNodes.end(); ++it) {
        Node *n = it.value();
        _scene->graph()->addNode(n, it.key());
        NodeItem *ni = new NodeItem(n);
        _scene->nodeItems().insert(n, ni);
        _scene->addItem(ni);
        ni->setSelected(true);
    }

    for (auto it = _deleteEdges.begin(); it != _deleteEdges.end(); ++it) {
        Edge *e = it.value();
        _scene->graph()->addEdge(e, it.key());
        EdgeItem *ei = new EdgeItem(e);
        _scene->edgeItems().insert(e, ei);
        _scene->addItem(ei);

        if (_selEdges.contains(e)) ei->setSelected(true);
    }
}

void DeleteCommand::redo()
{
    foreach (Edge *e, _deleteEdges.values()) {
        EdgeItem *ei = _scene->edgeItems()[e];
        _scene->edgeItems().remove(e);
        _scene->removeItem(ei);
        delete ei;

        _scene->graph()->removeEdge(e);
    }

    foreach (Node *n, _deleteNodes.values()) {
        NodeItem *ni = _scene->nodeItems()[n];
        _scene->nodeItems().remove(n);
        _scene->removeItem(ni);
        delete ni;

        _scene->graph()->removeNode(n);
    }
}

AddNodeCommand::AddNodeCommand(TikzScene *scene, Node *node, QRectF newBounds) :
    _scene(scene), _node(node), _oldBounds(_scene->sceneRect()), _newBounds(newBounds)
{
}

void AddNodeCommand::undo()
{
    NodeItem *ni = _scene->nodeItems()[_node];
    _scene->removeItem(ni);
    _scene->nodeItems().remove(_node);
    delete ni;

    _scene->graph()->removeNode(_node);

    _scene->setBounds(_oldBounds);
}

void AddNodeCommand::redo()
{
    // TODO: get the current style
    _scene->graph()->addNode(_node);
    NodeItem *ni = new NodeItem(_node);
    _scene->nodeItems().insert(_node, ni);
    _scene->addItem(ni);

    _scene->setBounds(_newBounds);
}

AddEdgeCommand::AddEdgeCommand(TikzScene *scene, Edge *edge) :
    _scene(scene), _edge(edge)
{
}

void AddEdgeCommand::undo()
{
    EdgeItem *ei = _scene->edgeItems()[_edge];
    _scene->removeItem(ei);
    _scene->edgeItems().remove(_edge);
    delete ei;

    _scene->graph()->removeEdge(_edge);
}

void AddEdgeCommand::redo()
{
    // TODO: get the current style
    _scene->graph()->addEdge(_edge);
    EdgeItem *ei = new EdgeItem(_edge);
    _scene->edgeItems().insert(_edge, ei);
    _scene->addItem(ei);

    // edges should always be stacked below nodes
    if (!_scene->graph()->nodes().isEmpty()) {
        ei->stackBefore(_scene->nodeItems()[_scene->graph()->nodes().first()]);
    }
}

ChangeEdgeModeCommand::ChangeEdgeModeCommand(TikzScene *scene, Edge *edge) :
    _scene(scene), _edge(edge)
{
}

void ChangeEdgeModeCommand::undo()
{
    _edge->setBasicBendMode(!_edge->basicBendMode());
    _scene->edgeItems()[_edge]->readPos();
}

void ChangeEdgeModeCommand::redo()
{
    _edge->setBasicBendMode(!_edge->basicBendMode());
    _scene->edgeItems()[_edge]->readPos();
}
