#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include "graph.h"
#include "nodeitem.h"
#include "edgeitem.h"

#include <QWidget>
#include <QGraphicsScene>
#include <QPainter>
#include <QRectF>
#include <QVector>
#include <QGraphicsEllipseItem>
#include <QGraphicsSceneMouseEvent>

class TikzScene : public QGraphicsScene
{
    Q_OBJECT
public:
    TikzScene(Graph *graph, QObject *parent);
    ~TikzScene();
    Graph *graph() const;
    void setGraph(Graph *graph);
public slots:
    void graphReplaced();
protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event);
    void mouseMoveEvent(QGraphicsSceneMouseEvent *event);
    void mouseReleaseEvent(QGraphicsSceneMouseEvent *event);
private:
    Graph *_graph;
    QVector<NodeItem*> nodeItems;
    QVector<EdgeItem*> edgeItems;
    QHash<Node*,QPointF> *_oldNodePositions;
};

#endif // TIKZSCENE_H
