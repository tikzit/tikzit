/*!
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
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *);
    QPainterPath shape() const override;
    QRectF boundingRect() const override;
	void updateBounds();
    Node *node() const;

private:
    Node *_node;
    QRectF labelRect() const;
	QRectF _boundingRect;
};

#endif // NODEITEM_H
