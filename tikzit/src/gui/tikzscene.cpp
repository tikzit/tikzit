#include "tikzscene.h"

#include <QPen>
#include <QBrush>

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

    QPen blackPen(Qt::black);
    QBrush redBrush(Qt::red);

    foreach (Node *n, _graph->nodes()) {
        NodeItem *ni = new NodeItem(n);
        nodeItems << ni;
        addItem(ni);
    }
}

void TikzScene::drawBackground(QPainter *painter, const QRectF &rect)
{
    // draw the grid
    int step = 10;

    QPen pen;
    pen.setWidth(2);
    pen.setCosmetic(true);
    pen.setColor(QColor(245,245,255));

    painter->setPen(pen);
    for (int x = step; x < rect.right(); x += step) {
        if (x % (step * 8) != 0) {
            painter->drawLine(x, rect.top(), x, rect.bottom());
            painter->drawLine(-x, rect.top(), -x, rect.bottom());
        }
    }

    for (int y = step; y < rect.bottom(); y += step) {
        if (y % (step * 8) != 0) {
            painter->drawLine(rect.left(), y, rect.right(), y);
            painter->drawLine(rect.left(), -y, rect.right(), -y);
        }
    }

    pen.setColor(QColor(240,240,245));
    painter->setPen(pen);
    for (int x = step*8; x < rect.right(); x += step*8) {
        painter->drawLine(x, rect.top(), x, rect.bottom());
        painter->drawLine(-x, rect.top(), -x, rect.bottom());
    }

    for (int y = step*8; y < rect.bottom(); y += step*8) {
        painter->drawLine(rect.left(), y, rect.right(), y);
        painter->drawLine(rect.left(), -y, rect.right(), -y);
    }

    pen.setColor(QColor(230,230,240));
    painter->setPen(pen);
    painter->drawLine(rect.left(), 0, rect.right(), 0);
    painter->drawLine(0, rect.top(), 0, rect.bottom());
}
