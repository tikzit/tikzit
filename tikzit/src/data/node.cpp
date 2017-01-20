#include "node.h"

#include <QDebug>

Node::Node(QObject *parent) : QObject(parent)
{
    qDebug() << "Node()";
}

Node::~Node()
{
    qDebug() << "~Node()";
}

QPointF Node::pos() const
{
    return _pos;
}

void Node::setPos(const QPointF &pos)
{
    _pos = pos;
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
