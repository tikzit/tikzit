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

/*!
  * A QGraphicsItem that handles drawing a single edge.
  */

#ifndef EDGEITEM_H
#define EDGEITEM_H

#include "edge.h"

#include <QObject>
#include <QGraphicsPathItem>
#include <QPainter>
#include <QStyleOptionGraphicsItem>
#include <QWidget>
#include <QGraphicsEllipseItem>
#include <QString>

class EdgeItem : public QGraphicsItem
{
public:
    EdgeItem(Edge *edge);
    void readPos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *) override;
    QRectF boundingRect() const override;
    QPainterPath shape() const override;
    Edge *edge() const;
    QGraphicsEllipseItem *cp1Item() const;
    QGraphicsEllipseItem *cp2Item() const;


    QPainterPath path() const;
    void setPath(const QPainterPath &path);


private:
    Edge *_edge;
    QPainterPath _path;
    QPainterPath _expPath;
    QRectF _boundingRect;
    QGraphicsEllipseItem *_cp1Item;
    QGraphicsEllipseItem *_cp2Item;
};

#endif // EDGEITEM_H
