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

#include "style.h"
#include "tikzit.h"

Style *noneStyle = new Style("none", new GraphElementData());
Style *unknownStyle = new Style("unknown", new GraphElementData({GraphElementProperty("tikzit fill", "blue")}));
Style *noneEdgeStyle = new Style("none", new GraphElementData({GraphElementProperty("-")}));

Style::Style() : _name("none")
{
    _data = new GraphElementData(this);
}

Style::Style(QString name, GraphElementData *data) : _name(name), _data(data)
{
    _data->setParent(this);
}

bool Style::isNone() const
{
    return _name == "none";
}

GraphElementData *Style::data() const
{
    return _data;
}

QString Style::name() const
{
    return _name;
}

QColor Style::strokeColor(bool tikzitOverride) const
{
    QString col = propertyWithDefault("draw", "black", tikzitOverride);
    return tikzit->colorByName(col);
}

QColor Style::fillColor(bool tikzitOverride) const
{
    QString col = propertyWithDefault("fill", "white", tikzitOverride);
    return tikzit->colorByName(col);
}

QBrush Style::brush() const
{
    return QBrush(fillColor());
}

QString Style::shape(bool tikzitOverride) const
{
    return propertyWithDefault("shape", "circle", tikzitOverride);
}


// TODO
int Style::strokeThickness() const
{
    return 1;
}

bool Style::isEdgeStyle() const
{
    if (_data->atom("-")  || _data->atom("->") || _data->atom("-|") ||
        _data->atom("<-") || _data->atom("<->") || _data->atom("<-|") ||
        _data->atom("|-") || _data->atom("|->") || _data->atom("|-|")) return true;
    else return false;
}



QString Style::propertyWithDefault(QString prop, QString def, bool tikzitOverride) const
{
    if (_data == 0) return def;
    QString val;
    if (tikzitOverride) {
        val = _data->property("tikzit " + prop);
        if (val.isNull()) val = _data->property(prop);
    } else {
        val = _data->property(prop);
    }
    if (val.isNull()) val = def;
    return val;
}

QString Style::tikz() const
{
    return "\\tikzstyle{" + _name + "}=" + _data->tikz();
}

void Style::setName(const QString &name)
{
    _name = name;
}

Style::ArrowTipStyle Style::arrowHead() const
{
    if (_data->atom("->") || _data->atom("<->") || _data->atom("|->")) return Pointer;
    if (_data->atom("-|") || _data->atom("<-|") || _data->atom("|-|")) return Flat;
    return NoTip;
}

Style::ArrowTipStyle Style::arrowTail() const
{
    if (_data->atom("<-") || _data->atom("<->") || _data->atom("<-|")) return Pointer;
    if (_data->atom("|-") || _data->atom("|->") || _data->atom("|-|")) return Flat;
    return NoTip;
}

Style::DrawStyle Style::drawStyle() const
{
    if (_data->atom("dashed")) return Dashed;
    if (_data->atom("dotted")) return Dotted;
    return Solid;
}


QPen Style::pen() const
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

QPainterPath Style::path() const
{
    QPainterPath pth;
    QString sh = shape();

    if (sh == "rectangle") {
        pth.addRect(-30.0f, -30.0f, 60.0f, 60.0f);
    } else { // default is 'circle'
        pth.addEllipse(QPointF(0.0f,0.0f), 30.0f, 30.0f);
    }
    return pth;
}

QIcon Style::icon() const
{
    if (!isEdgeStyle()) {
        // draw an icon matching the style
        QImage px(100,100,QImage::Format_ARGB32_Premultiplied);
        px.fill(Qt::transparent);


        QPainter painter(&px);
        painter.setRenderHint(QPainter::Antialiasing);
        QPainterPath pth = path();
        pth.translate(50.0f, 50.0f);

        if (isNone()) {
            QColor c(180,180,200);
            painter.setPen(QPen(c));
            painter.setBrush(QBrush(c));
            painter.drawEllipse(QPointF(50.0f,50.0f), 3,3);

            QPen pen(QColor(180,180,220));
            pen.setWidth(3);
            QVector<qreal> p;
            p << 2.0 << 2.0;
            pen.setDashPattern(p);
            painter.setPen(pen);
            painter.setBrush(Qt::NoBrush);
            painter.drawPath(pth);
        } else {
            painter.setPen(pen());
            painter.setBrush(brush());
            painter.drawPath(pth);
        }

        return QIcon(QPixmap::fromImage(px));
    } else {
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
}

QString Style::category() const
{
    return propertyWithDefault("tikzit category", "", false);
}
