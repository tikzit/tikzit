#include "tikzit.h"
#include "tikzscene.h"

#include <QPen>
#include <QBrush>
#include <QDebug>


TikzScene::TikzScene(Graph *graph, QObject *parent) :
    QGraphicsScene(parent), _graph(graph)
{

}

Graph *TikzScene::graph() const
{
    return _graph;
}

void TikzScene::setGraph(Graph *graph)
{
    _graph = graph;
    graphReplaced();
}

void TikzScene::graphReplaced()
{
    foreach (NodeItem *ni, nodeItems) {
        removeItem(ni);
        delete ni;
    }
    nodeItems.clear();

    foreach (EdgeItem *ei, edgeItems) {
        removeItem(ei);
        delete ei;
    }
    edgeItems.clear();

    foreach (Edge *e, _graph->edges()) {
        EdgeItem *ei = new EdgeItem(e);
        edgeItems << ei;
        addItem(ei);
    }

    foreach (Node *n, _graph->nodes()) {
        NodeItem *ni = new NodeItem(n);
        nodeItems << ni;
        addItem(ni);
    }
}

void TikzScene::mousePressEvent(QGraphicsSceneMouseEvent *event)
{
    // TODO: check if we grabbed a control point

    QGraphicsScene::mousePressEvent(event);
}

void TikzScene::mouseMoveEvent(QGraphicsSceneMouseEvent *event)
{
    //foreach (Edge *e, _graph->edges()) { e->updateControls(); }
    foreach (EdgeItem *ei, edgeItems) {
        ei->edge()->updateControls();
        ei->syncPos();
    }

    QGraphicsScene::mouseMoveEvent(event);
}

void TikzScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    QGraphicsScene::mouseReleaseEvent(event);
}
