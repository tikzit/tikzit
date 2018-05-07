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

#include "tikzstyles.h"
#include "nodestyle.h"

#include <QDebug>

TikzStyles::TikzStyles(QObject *parent) : QObject(parent)
{

}

NodeStyle *TikzStyles::nodeStyle(QString name) const
{
    foreach (NodeStyle *s , _nodeStyles)
        if (s->name() == name) return s;
    return noneStyle;
}

EdgeStyle *TikzStyles::edgeStyle(QString name) const
{
    foreach (EdgeStyle *s , _edgeStyles)
        if (s->name() == name) return s;
    return noneEdgeStyle;
}

QVector<NodeStyle *> TikzStyles::nodeStyles() const
{
    return _nodeStyles;
}

void TikzStyles::clear()
{
    _nodeStyles.clear();
    _edgeStyles.clear();
}

QVector<EdgeStyle *> TikzStyles::edgeStyles() const
{
    return _edgeStyles;
}

void TikzStyles::addStyle(QString name, GraphElementData *data)
{
    if (data->atom("-") || data->atom("->") || data->atom("-|") ||
        data->atom("<-") || data->atom("<->") || data->atom("<-|") ||
        data->atom("|-") || data->atom("|->") || data->atom("|-|"))
    { // edge style
        qDebug() << "got edge style" << name;
        _edgeStyles << new EdgeStyle(name, data);
    } else { // node style
        qDebug() << "got node style" << name;
        _nodeStyles << new NodeStyle(name, data);
    }
}
