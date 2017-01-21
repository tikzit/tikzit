#include "node.h"

#include <QDebug>

Node::Node(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData();
}

Node::~Node()
{
    delete _data;
}

QPointF Node::point() const
{
    return _point;
}

void Node::setPoint(const QPointF &point)
{
    _point = point;
}

QString Node::name() const
{
    return _name;
}

void Node::setName(const QString &name)
{
    _name = name;
}

QString Node::label() const
{
    return _label;
}

void Node::setLabel(const QString &label)
{
    _label = label;
}

GraphElementData *Node::data() const
{
    return _data;
}

void Node::setData(GraphElementData *data)
{
    delete _data;
    _data = data;
}

