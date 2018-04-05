#include "undocommands.h"
#include "nodeitem.h"
#include "edgeitem.h"

#include <QGraphicsView>

GraphUpdateCommand::GraphUpdateCommand(TikzScene *scene, QUndoCommand *parent) : QUndoCommand(parent), _scene(scene)
{
}

void GraphUpdateCommand::undo()
{
    _scene->tikzDocument()->refreshTikz();
    _scene->refreshSceneBounds();
    _scene->invalidate();
}

void GraphUpdateCommand::redo()
{
    _scene->tikzDocument()->refreshTikz();
    _scene->refreshSceneBounds();
    _scene->invalidate();
}


MoveCommand::MoveCommand(TikzScene *scene,
                         QMap<Node*, QPointF> oldNodePositions,
                         QMap<Node*, QPointF> newNodePositions,
                         QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent),
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
    GraphUpdateCommand::undo();
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
    GraphUpdateCommand::redo();
}

EdgeBendCommand::EdgeBendCommand(TikzScene *scene, Edge *edge,
                                 float oldWeight, int oldBend,
                                 int oldInAngle, int oldOutAngle, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent),
    _edge(edge),
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
    GraphUpdateCommand::undo();
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

    GraphUpdateCommand::redo();
}

DeleteCommand::DeleteCommand(TikzScene *scene,
                             QMap<int, Node *> deleteNodes,
                             QMap<int, Edge *> deleteEdges,
                             QSet<Edge *> selEdges, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent),
    _deleteNodes(deleteNodes), _deleteEdges(deleteEdges), _selEdges(selEdges)
{}

void DeleteCommand::undo()
{
    for (auto it = _deleteNodes.begin(); it != _deleteNodes.end(); ++it) {
        Node *n = it.value();
        n->attachStyle(); // in case styles have changed
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

    GraphUpdateCommand::undo();
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

    GraphUpdateCommand::redo();
}

AddNodeCommand::AddNodeCommand(TikzScene *scene, Node *node, QRectF newBounds, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _node(node), _oldBounds(_scene->sceneRect()), _newBounds(newBounds)
{
}

void AddNodeCommand::undo()
{
    NodeItem *ni = _scene->nodeItems()[_node];
    _scene->removeItem(ni);
    _scene->nodeItems().remove(_node);
    delete ni;

    _scene->graph()->removeNode(_node);

    //_scene->setBounds(_oldBounds);

    GraphUpdateCommand::undo();
}

void AddNodeCommand::redo()
{
    _node->attachStyle(); // in case styles have changed
    _scene->graph()->addNode(_node);
    NodeItem *ni = new NodeItem(_node);
    _scene->nodeItems().insert(_node, ni);
    _scene->addItem(ni);

    //_scene->setBounds(_newBounds);

    GraphUpdateCommand::redo();
}

AddEdgeCommand::AddEdgeCommand(TikzScene *scene, Edge *edge, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _edge(edge)
{
}

void AddEdgeCommand::undo()
{
    EdgeItem *ei = _scene->edgeItems()[_edge];
    _scene->removeItem(ei);
    _scene->edgeItems().remove(_edge);
    delete ei;

    _scene->graph()->removeEdge(_edge);
    GraphUpdateCommand::undo();
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

    GraphUpdateCommand::redo();
}

ChangeEdgeModeCommand::ChangeEdgeModeCommand(TikzScene *scene, Edge *edge, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _edge(edge)
{
}

void ChangeEdgeModeCommand::undo()
{
    _edge->setBasicBendMode(!_edge->basicBendMode());
    _scene->edgeItems()[_edge]->readPos();
    GraphUpdateCommand::undo();
}

void ChangeEdgeModeCommand::redo()
{
    _edge->setBasicBendMode(!_edge->basicBendMode());
    _scene->edgeItems()[_edge]->readPos();
    GraphUpdateCommand::redo();
}

ApplyStyleToNodesCommand::ApplyStyleToNodesCommand(TikzScene *scene, QString style, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _style(style), _oldStyles()
{
    foreach (QGraphicsItem *it, scene->selectedItems()) {
        if (NodeItem *ni = dynamic_cast<NodeItem*>(it)) {
            _oldStyles.insert(ni->node(), ni->node()->styleName());
        }
    }
}

void ApplyStyleToNodesCommand::undo()
{
    foreach (Node *n, _oldStyles.keys()) {
        n->setStyleName(_oldStyles[n]);
        n->attachStyle();
    }

    GraphUpdateCommand::undo();
}

void ApplyStyleToNodesCommand::redo()
{
    foreach (Node *n, _oldStyles.keys()) {
        n->setStyleName(_style);
        n->attachStyle();
    }
    GraphUpdateCommand::redo();
}

PasteCommand::PasteCommand(TikzScene *scene, Graph *graph, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _graph(graph)
{
    _oldSelection = scene->selectedItems();
}

void PasteCommand::undo()
{
    _scene->clearSelection();

    foreach (Edge *e, _graph->edges()) {
        EdgeItem *ei = _scene->edgeItems()[e];
        _scene->edgeItems().remove(e);
        _scene->removeItem(ei);
        delete ei;

        _scene->graph()->removeEdge(e);
    }

    foreach (Node *n, _graph->nodes()) {
        NodeItem *ni = _scene->nodeItems()[n];
        _scene->nodeItems().remove(n);
        _scene->removeItem(ni);
        delete ni;

        _scene->graph()->removeNode(n);
    }

    foreach (auto it, _oldSelection) it->setSelected(true);

    GraphUpdateCommand::undo();
}

void PasteCommand::redo()
{
    _scene->clearSelection();
    _scene->graph()->insertGraph(_graph);

    foreach (Edge *e, _graph->edges()) {
        EdgeItem *ei = new EdgeItem(e);
        _scene->edgeItems().insert(e, ei);
        _scene->addItem(ei);
    }

    foreach (Node *n, _graph->nodes()) {
        n->attachStyle(); // in case styles have changed
        NodeItem *ni = new NodeItem(n);
        _scene->nodeItems().insert(n, ni);
        _scene->addItem(ni);
        ni->setSelected(true);
    }

    GraphUpdateCommand::redo();
}

ChangeLabelCommand::ChangeLabelCommand(TikzScene *scene, Graph *graph, QMap<Node *, QString> oldLabels, QString newLabel, QUndoCommand *parent) :
    GraphUpdateCommand(scene, parent), _oldLabels(oldLabels), _newLabel(newLabel)
{
}

void ChangeLabelCommand::undo()
{
    foreach (Node *n, _oldLabels.keys()) {
        n->setLabel(_oldLabels[n]);
    }

    GraphUpdateCommand::undo();
}

void ChangeLabelCommand::redo()
{
    foreach (Node *n, _oldLabels.keys()) {
        n->setLabel(_newLabel);
    }

    GraphUpdateCommand::redo();
}
