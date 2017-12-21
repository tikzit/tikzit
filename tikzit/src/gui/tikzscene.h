/**
  * Manage the scene, which contains a single Graph, and respond to user input. This serves as
  * the controller for the MVC (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include "graph.h"
#include "nodeitem.h"
#include "edgeitem.h"
#include "tikzdocument.h"

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
    TikzScene(TikzDocument *tikzDocument, QObject *parent);
    ~TikzScene();
    Graph *graph() const;
    QVector<NodeItem *> nodeItems() const;
    QVector<EdgeItem *> edgeItems() const;
    void refreshAdjacentEdges(QList<Node*> nodes);

    TikzDocument *tikzDocument() const;
    void setTikzDocument(TikzDocument *tikzDocument);

public slots:
    void graphReplaced();
protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event);
    void mouseMoveEvent(QGraphicsSceneMouseEvent *event);
    void mouseReleaseEvent(QGraphicsSceneMouseEvent *event);
private:
    TikzDocument *_tikzDocument;
    QVector<NodeItem*> _nodeItems;
    QVector<EdgeItem*> _edgeItems;
    EdgeItem *_modifyEdgeItem;
    bool _firstControlPoint;
    QMap<Node*,QPointF> _oldNodePositions;
};

#endif // TIKZSCENE_H
