#include "nodestyle.h"
#include <QPainter>

NodeStyle *noneStyle = new NodeStyle();

NodeStyle::NodeStyle() : _name("none"), _data(0)
{
}


NodeStyle::NodeStyle(QString name, GraphElementData *data): _name(name), _data(data)
{
}

bool NodeStyle::isNone() { return _data == 0; }

GraphElementData *NodeStyle::data() const
{
    return _data;
}

QString NodeStyle::name() const
{
    return _name;
}

NodeShape NodeStyle::shape() const
{
    QString sh = _data->property("shape");
    if (sh.isNull()) return NodeShape::Circle;
    else if (sh == "circle") return NodeShape::Circle;
    else if (sh == "rectangle") return NodeShape::Rectangle;
    else return NodeShape::Circle;
}

QColor NodeStyle::fillColor() const
{
    QString col = _data->property("fill");

    if (col.isNull()) {
        return QColor(Qt::white);
    } else {
        QColor namedColor(col);
        if (namedColor.isValid()) {
            return namedColor;
        } else {
            // TODO: read RGB colors
            return QColor(Qt::white);
        }
    }
}

QColor NodeStyle::strokeColor() const
{
    QString col = _data->property("draw");

    if (col.isNull()) {
        return QColor(Qt::black);
    } else {
        QColor namedColor(col);
        if (namedColor.isValid()) {
            return namedColor;
        } else {
            // TODO: read RGB colors
            return QColor(Qt::white);
        }
    }
}

int NodeStyle::strokeThickness() const
{
    return 1;
}

QPen NodeStyle::pen() const
{
    QPen p(strokeColor());
    p.setWidthF((float)strokeThickness() * 3.0f);
    return p;
}

QBrush NodeStyle::brush() const
{
    return QBrush(fillColor());
}

QPainterPath NodeStyle::path() const
{
    QPainterPath pth;
    pth.addEllipse(QPointF(0.0f,0.0f), 30.0f, 30.0f);
    return pth;
}

QPainterPath NodeStyle::palettePath() const
{
    return path();
}

QIcon NodeStyle::icon() const
{
    // draw an icon matching the style
    QPixmap px(100,100);
    px.fill(Qt::transparent);
    QPainter painter(&px);
    QPainterPath pth = path();
    painter.setPen(pen());
    painter.setBrush(brush());

    pth.translate(50.0f, 50.0f);
    painter.drawPath(pth);
    return QIcon(px);
}

