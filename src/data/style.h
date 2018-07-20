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

#ifndef STYLE_H
#define STYLE_H


#include "graphelementdata.h"

#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class Style
{
public:
    Style();
    Style(QString name, GraphElementData *data);
    bool isNone();

    // properties that both edges and nodes have
    GraphElementData *data() const;
    QString name() const;
    QColor strokeColor() const;
    int strokeThickness() const;

    // methods that are implemented differently for edges and nodes
    virtual QPen pen() const;
    virtual QPainterPath path() const = 0;
    virtual QPainterPath palettePath() const = 0;
    virtual QIcon icon() const = 0;
protected:
    QString propertyWithDefault(QString prop, QString def) const;
    QString _name;
    GraphElementData *_data;
};
#endif // STYLE_H
