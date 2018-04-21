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
#include <QString>

class EdgeItem : public QGraphicsItem
{
public:
    EdgeItem(Edge *edge);
    void readPos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *);
    QRectF boundingRect() const;
    QPainterPath shape() const;
    Edge *edge() const;
    QGraphicsEllipseItem *cp1Item() const;
    QGraphicsEllipseItem *cp2Item() const;


    QPainterPath path() const;
    void setPath(const QPainterPath &path);


private:
    Edge *_edge;
    QPainterPath _path;
    QPainterPath _expPath;
    QRectF _boundingRect;
    QGraphicsEllipseItem *_cp1Item;
    QGraphicsEllipseItem *_cp2Item;
};

#endif // EDGEITEM_H
