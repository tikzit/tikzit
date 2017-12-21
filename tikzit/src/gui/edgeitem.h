/**
  * A QGraphicsItem that handles drawing a single edge.
  */

#ifndef EDGEITEM_H
#define EDGEITEM_H

#include "edge.h"

#include <QObject>
#include <QGraphicsPathItem>
#include <QPainter>
#include <QStyleOptionGraphicsItem>
#include <QWidget>
#include <QGraphicsEllipseItem>

class EdgeItem : public QGraphicsPathItem
{
public:
    EdgeItem(Edge *edge);
    void readPos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *option,
               QWidget *widget);
    QRectF boundingRect() const;
    QPainterPath shape() const;
    Edge *edge() const;
    QGraphicsEllipseItem *cp1Item() const;
    QGraphicsEllipseItem *cp2Item() const;

private:
    Edge *_edge;
    QGraphicsEllipseItem *_cp1Item;
    QGraphicsEllipseItem *_cp2Item;
};

#endif // EDGEITEM_H
