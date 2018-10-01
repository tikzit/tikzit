/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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

bool Node::isBlankNode()
{
    return styleName() == "none";
}

int Node::tikzLine() const
{
    return _tikzLine;
}

void Node::setTikzLine(int tikzLine)
{
    _tikzLine = tikzLine;
}
