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

#ifndef EDGESTYLE_H
#define EDGESTYLE_H

#include "style.h"

#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class EdgeStyle : public Style
{
public:
    EdgeStyle();
    EdgeStyle(QString name, GraphElementData *data);

    enum ArrowTipStyle {
        Flat, Pointer, NoTip
    };

    enum DrawStyle {
        Solid, Dotted, Dashed
    };

    ArrowTipStyle arrowHead() const;
    ArrowTipStyle arrowTail() const;
    DrawStyle drawStyle() const;

    QPen pen() const;
    QPainterPath path() const override;
    QPainterPath palettePath() const override;
    QIcon icon() const override;
};

extern EdgeStyle *noneEdgeStyle;

#endif // EDGESTYLE_H
