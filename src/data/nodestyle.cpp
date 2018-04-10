#include "nodestyle.h"
#include <QPainter>

NodeStyle *noneStyle = new NodeStyle();

NodeStyle::NodeStyle() : Style()
{
}


NodeStyle::NodeStyle(QString name, GraphElementData *data): Style(name, data)
{
}

QColor NodeStyle::fillColor() const
{
    if (_data == 0) return Qt::white;

    QString col = propertyWithDefault("fill", "white");

    QColor namedColor(col);
    if (namedColor.isValid()) {
        return namedColor;
    } else {
        // TODO: read RGB colors
        return QColor(Qt::white);
    }
}

QBrush NodeStyle::brush() const
{
    return QBrush(fillColor());
}

NodeStyle::Shape NodeStyle::shape() const
{
    if (_data == 0) return NodeStyle::Circle;

    QString sh = propertyWithDefault("shape", "circle");
    if (sh == "circle") return NodeStyle::Circle;
    else if (sh == "rectangle") return NodeStyle::Rectangle;
    else return NodeStyle::Circle;
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

