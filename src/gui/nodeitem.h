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
  * A QGraphicsItem that handles drawing a single node.
  */

#ifndef NODEITEM_H
#define NODEITEM_H

#include "node.h"

#include <QObject>
#include <QGraphicsItem>
#include <QPainterPath>
#include <QRectF>

class NodeItem : public QGraphicsItem
{
public:
    NodeItem(Node *node);
    void readPos();
    void writePos();
    void paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *) override;
    QPainterPath shape() const override;
    QRectF boundingRect() const override;
	void updateBounds();
    Node *node() const;

private:
    Node *_node;
    QRectF labelRect() const;
	QRectF _boundingRect;
};

#endif // NODEITEM_H
