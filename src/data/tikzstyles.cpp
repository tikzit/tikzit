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
#include <QColorDialog>

TikzStyles::TikzStyles(QObject *parent) : QObject(parent)
{
    // 19 standard xcolor colours
    _colNames <<
        "black" <<
        "gray" <<
        "darkgray" <<
        "lightgray" <<
        "white" <<

        "red" <<
        "orange" <<
        "yellow" <<
        "lime" <<
        "blue" <<
        "purple" <<

        "brown" <<
        "olive" <<
        "green" <<
        "teal" <<
        "cyan" <<

        "magenta" <<
        "violet" <<
        "pink";

    for (int i = 0; i < _colNames.length(); ++i) {
        _cols << QColor(_colNames[i]);
    }
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

QColor TikzStyles::colorByIndex(int i)
{
    return _cols[i];
}

QColor TikzStyles::colorByName(QString name)
{
    for (int i = 0; i < _colNames.length(); ++i) {
        if (_colNames[i] == name) return _cols[i];
    }
    return QColor();
}

QString TikzStyles::nameForColor(QColor col)
{
    for (int i = 0; i < _colNames.length(); ++i) {
        if (_cols[i] == col) return _colNames[i];
    }
    return QString();
}

void TikzStyles::refreshModels(QStandardItemModel *nodeModel, QStandardItemModel *edgeModel)
{
    nodeModel->clear();
    edgeModel->clear();
    //QString f = tikzit->styleFile();
    //ui->styleFile->setText(f);

    QStandardItem *it;

    it = new QStandardItem(noneStyle->icon(), noneStyle->name());
    it->setEditable(false);
    it->setData(noneStyle->name());
    nodeModel->appendRow(it);

    foreach(NodeStyle *ns, _nodeStyles) {
        it = new QStandardItem(ns->icon(), ns->name());
        it->setEditable(false);
        it->setData(ns->name());
        nodeModel->appendRow(it);
    }

    it = new QStandardItem(noneEdgeStyle->icon(), noneEdgeStyle->name());
    it->setEditable(false);
    it->setData(noneEdgeStyle->name());
    edgeModel->appendRow(it);

    foreach(EdgeStyle *es, _edgeStyles) {
        it = new QStandardItem(es->icon(), es->name());
        it->setEditable(false);
        it->setData(es->name());
        edgeModel->appendRow(it);
    }
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
