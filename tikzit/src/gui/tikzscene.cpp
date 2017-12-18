/**
  * Manage the scene, which contains a single Graph, and respond to user input. This serves as
  * the controller for the MVC (Graph, TikzView, TikzScene).
  */

#include "tikzit.h"
#include "tikzscene.h"

#include <QPen>
#include <QBrush>
#include <QDebug>


TikzScene::TikzScene(Graph *graph, QObject *parent) :
    QGraphicsScene(parent), _graph(graph)
{
}

TikzScene::~TikzScene() {
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
    QPointF mousePos(event->buttonDownScenePos(Qt::LeftButton).x(),
                     event->buttonDownScenePos(Qt::LeftButton).y());


    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        // TODO: check if we grabbed a control point
        QGraphicsScene::mousePressEvent(event);
        if (!selectedItems().empty() && !items(mousePos).empty()) {
            _oldNodePositions = new QHash<NodeItem*,QPointF>();
            for (QGraphicsItem *gi : selectedItems()) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                    _oldNodePositions->
                }
            }
            qDebug() << "I am dragging";
        }
        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::mouseMoveEvent(QGraphicsSceneMouseEvent *event)
{
    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        QGraphicsScene::mouseMoveEvent(event);
        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }

    // TODO: only sync edges that change
    foreach (EdgeItem *ei, edgeItems) {
        ei->edge()->updateControls();
        ei->syncPos();
    }
}

void TikzScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        QGraphicsScene::mouseReleaseEvent(event);
        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }
}
