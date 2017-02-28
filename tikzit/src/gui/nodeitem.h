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
    void syncPos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget);
    QPainterPath shape() const;
    QRectF boundingRect() const;
private:
    Node *_node;
};

#endif // NODEITEM_H
