#include "node.h"
#include "tikzit.h"

#include <QDebug>

Node::Node(QObject *parent) : QObject(parent), _tikzLine(-1)
{
    _data = new GraphElementData();
    _style = noneStyle;
    _data->setProperty("style", "none");
}

Node::~Node()
{
    delete _data;
}

Node *Node::copy() {
    Node *n1 = new Node();
    n1->setName(name());
    n1->setData(data()->copy());
    n1->setPoint(point());
    n1->setLabel(label());
    n1->attachStyle();
    n1->setTikzLine(tikzLine());
    return n1;
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

QString Node::styleName() const
{
    return _data->property("style");
}

void Node::setStyleName(const QString &styleName)
{
    _data->setProperty("style", styleName);
}

void Node::attachStyle()
{
    QString nm = styleName();
    if (nm == "none") _style = noneStyle;
    else _style = tikzit->styles()->nodeStyle(nm);
}

NodeStyle *Node::style() const
{
    return _style;
}

int Node::tikzLine() const
{
    return _tikzLine;
}

void Node::setTikzLine(int tikzLine)
{
    _tikzLine = tikzLine;
}
