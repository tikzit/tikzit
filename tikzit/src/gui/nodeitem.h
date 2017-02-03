#ifndef NODEITEM_H
#define NODEITEM_H

#include "node.h"

#include <QObject>
#include <QGraphicsEllipseItem>

class NodeItem : public QGraphicsEllipseItem
{
public:
    NodeItem(Node *node);
    void syncPos();
private:
    Node *_node;
};

#endif // NODEITEM_H
