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
    p.setWidthF((float)strokeThickness() * 3.0f);

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

    switch (arrowHead()) {
    case Pointer:
        painter.drawLine(90,50,80,40);
        painter.drawLine(90,50,80,60);
        break;
    case Flat:
        painter.drawLine(90,40,90,60);
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
    }


    return QIcon(px);
}
