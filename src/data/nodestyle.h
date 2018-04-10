#ifndef NODESTYLE_H
#define NODESTYLE_H

#include "style.h"

#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class NodeStyle : public Style
{
public:
    enum Shape {
        Rectangle, UpTriangle, DownTriangle, Circle
    };

    NodeStyle();
    NodeStyle(QString name, GraphElementData *data);

    QColor fillColor() const;
    QBrush brush() const;
    QPainterPath path() const;
    Shape shape() const;

    QPainterPath palettePath() const override;
    QIcon icon() const override;
};

extern NodeStyle *noneStyle;

#endif // NODESTYLE_H
