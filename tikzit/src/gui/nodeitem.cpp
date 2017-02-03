#include "nodeitem.h"

#include <QPen>
#include <QBrush>

NodeItem::NodeItem(Node *node)
{
    _node = node;
    setPen(QPen(Qt::black));
    setBrush(QBrush(Qt::white));
    syncPos();
}

void NodeItem::syncPos()
{
    setRect(80*_node->point().x() - 8, -80*_node->point().y() - 8, 16, 16);
}
