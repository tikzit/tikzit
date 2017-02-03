#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include "graph.h"
#include "nodeitem.h"

#include <QWidget>
#include <QGraphicsScene>
#include <QPainter>
#include <QRectF>
#include <QVector>
#include <QGraphicsEllipseItem>

class TikzScene : public QGraphicsScene
{
    Q_OBJECT
public:
    TikzScene(Graph *graph, QObject *parent);
    Graph *graph() const;
    void setGraph(Graph *graph);
public slots:
    void graphReplaced();

private:
    Graph *_graph;
    QVector<NodeItem*> nodeItems;

protected:
    void drawBackground(QPainter *painter, const QRectF &rect);
};

#endif // TIKZSCENE_H
