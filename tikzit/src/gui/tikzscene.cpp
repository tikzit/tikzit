#include "tikzit.h"
#include "tikzscene.h"

#include <QPen>
#include <QBrush>
#include <QDebug>


TikzScene::TikzScene(TikzDocument *tikzDocument, QObject *parent) :
    QGraphicsScene(parent), _tikzDocument(tikzDocument)
{
}

TikzScene::~TikzScene() {
}

Graph *TikzScene::graph() const
{
    return _tikzDocument->graph();
}

void TikzScene::graphReplaced()
{
    foreach (NodeItem *ni, _nodeItems) {
        removeItem(ni);
        delete ni;
    }
    _nodeItems.clear();

    foreach (EdgeItem *ei, _edgeItems) {
        removeItem(ei);
        delete ei;
    }
    _edgeItems.clear();

    foreach (Edge *e, graph()->edges()) {
        EdgeItem *ei = new EdgeItem(e);
        _edgeItems << ei;
        addItem(ei);
    }

    foreach (Node *n, graph()->nodes()) {
        NodeItem *ni = new NodeItem(n);
        _nodeItems << ni;
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
            _oldNodePositions.clear();
            foreach (QGraphicsItem *gi, selectedItems()) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                    _oldNodePositions.insert(ni->node(), ni->node()->point());
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
    foreach (EdgeItem *ei, _edgeItems) {
        ei->edge()->updateControls();
        ei->syncPos();
    }
}

void TikzScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        QGraphicsScene::mouseReleaseEvent(event);

        if (!_oldNodePositions.empty()) {
            QMap<Node*,QPointF> newNodePositions;

            foreach (QGraphicsItem *gi, selectedItems()) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                    ni->writePos();
                    newNodePositions.insert(ni->node(), ni->node()->point());
                }
            }

            qDebug() << _oldNodePositions;
            qDebug() << newNodePositions;

            _oldNodePositions.clear();
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

TikzDocument *TikzScene::tikzDocument() const
{
    return _tikzDocument;
}

void TikzScene::setTikzDocument(TikzDocument *tikzDocument)
{
    _tikzDocument = tikzDocument;
    graphReplaced();
}

QVector<EdgeItem *> TikzScene::edgeItems() const
{
    return _edgeItems;
}

QVector<NodeItem *> TikzScene::nodeItems() const
{
    return _nodeItems;
}
