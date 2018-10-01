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

#include "edgestyle.h"

#include <QPainter>
#include <QPixmap>

EdgeStyle *noneEdgeStyle = new EdgeStyle();

EdgeStyle::EdgeStyle() : Style()
{
}

EdgeStyle::EdgeStyle(QString name, GraphElementData *data) : Style(name, data)
{
}

EdgeStyle::ArrowTipStyle EdgeStyle::arrowHead() const
{
    if (_data == 0) return NoTip;

    if (_data->atom("->") || _data->atom("<->") || _data->atom("|->")) return Pointer;
    if (_data->atom("-|") || _data->atom("<-|") || _data->atom("|-|")) return Flat;
    return NoTip;
}

EdgeStyle::ArrowTipStyle EdgeStyle::arrowTail() const
{
    if (_data == 0) return NoTip;
    if (_data->atom("<-") || _data->atom("<->") || _data->atom("<-|")) return Pointer;
    if (_data->atom("|-") || _data->atom("|->") || _data->atom("|-|")) return Flat;
    return NoTip;
}

EdgeStyle::DrawStyle EdgeStyle::drawStyle() const
{
    if (_data == 0) return Solid;
    if (_data->atom("dashed")) return Dashed;
    if (_data->atom("dotted")) return Dotted;
    return Solid;
}

QPen EdgeStyle::pen() const
{
    QPen p(strokeColor());
    p.setWidthF((float)strokeThickness() * 2.0f);

    QVector<qreal> pat;
    switch (drawStyle()) {
    case Dashed:
        pat << 3.0 << 3.0;
        p.setDashPattern(pat);
        break;
    case Dotted:
        pat << 1.0 << 1.0;
        p.setDashPattern(pat);
        break;
    case Solid:
        break;
    }

    return p;
}

QPainterPath EdgeStyle::path() const
{
    return QPainterPath();
}

QPainterPath EdgeStyle::palettePath() const
{
    return QPainterPath();
}

QIcon EdgeStyle::icon() const
{
    // draw an icon matching the style
    QPixmap px(100,100);
    px.fill(Qt::transparent);
    QPainter painter(&px);

    if (_data == 0) {
        QPen pen(Qt::black);
        pen.setWidth(3);
    } else {
        painter.setPen(pen());
    }

    painter.drawLine(10, 50, 90, 50);

	QPen pn = pen();
	pn.setStyle(Qt::SolidLine);
	painter.setPen(pn);

    switch (arrowHead()) {
    case Pointer:
        painter.drawLine(90,50,80,40);
        painter.drawLine(90,50,80,60);
        break;
    case Flat:
        painter.drawLine(90,40,90,60);
        break;
    case NoTip:
        break;
    }

    switch (arrowTail()) {
    case Pointer:
        painter.drawLine(10,50,20,40);
        painter.drawLine(10,50,20,60);
        break;
    case Flat:
        painter.drawLine(10,40,10,60);
        break;
    case NoTip:
        break;
    }


    return QIcon(px);
}
