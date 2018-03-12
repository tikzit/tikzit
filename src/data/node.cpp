#include "node.h"
#include "tikzit.h"

#include <QDebug>

Node::Node(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData();
    _style = noneStyle;
    _styleName = "none";
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
    if (_data->property("style") != 0) _styleName = _data->property("style");
}

QString Node::styleName() const
{
    return _styleName;
}

void Node::setStyleName(const QString &styleName)
{
    _styleName = styleName;
}

void Node::attachStyle()
{
    if (_styleName == "none") _style = noneStyle;
    else _style = tikzit->styles()->nodeStyle(_styleName);
}

NodeStyle *Node::style() const
{
    return _style;
}
