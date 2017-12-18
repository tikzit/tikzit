/**
  * A QGraphicsItem that handles drawing a single node.
  */

#ifndef NODEITEM_H
#define NODEITEM_H

#include "node.h"

#include <QObject>
#include <QGraphicsItem>
#include <QPainterPath>
#include <QRectF>

class NodeItem : public QGraphicsItem
{
public:
    NodeItem(Node *node);
    void readPos();
    void writePos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget);
    QVariant itemChange(GraphicsItemChange change, const QVariant &value);
    QPainterPath shape() const;
    QRectF boundingRect() const;
    Node *node() const;

private:
    Node *_node;
    QRectF labelRect() const;
};

#endif // NODEITEM_H
