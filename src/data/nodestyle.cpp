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

NodeStyle::Shape NodeStyle::shape() const
{
    if (_data == 0) return NodeStyle::Circle;

    QString sh = _data->property("shape");
    if (sh.isNull()) return NodeStyle::Circle;
    else if (sh == "circle") return NodeStyle::Circle;
    else if (sh == "rectangle") return NodeStyle::Rectangle;
    else return NodeStyle::Circle;
}

QColor NodeStyle::fillColor() const
{
    if (_data == 0) return Qt::white;

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
    if (_data == 0) return Qt::black;

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
    pth.translate(50.0f, 50.0f);

    if (_data == 0) {
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


    return QIcon(px);
}

