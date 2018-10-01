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

#ifndef NODE_H
#define NODE_H

#include "graphelementdata.h"
#include "nodestyle.h"

#include <QObject>
#include <QPointF>
#include <QString>

class Node : public QObject
{
    Q_OBJECT
public:
    explicit Node(QObject *parent = 0);
    ~Node();

    Node *copy();

    QPointF point() const;
    void setPoint(const QPointF &point);

    QString name() const;
    void setName(const QString &name);

    QString label() const;
    void setLabel(const QString &label);

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    QString styleName() const;
    void setStyleName(const QString &styleName);

    void attachStyle();
    NodeStyle *style() const;

    bool isBlankNode();

    int tikzLine() const;
    void setTikzLine(int tikzLine);

signals:

public slots:

private:
    QPointF _point;
    QString _name;
    QString _label;
    NodeStyle *_style;
    GraphElementData *_data;
    int _tikzLine;
};

#endif // NODE_H
