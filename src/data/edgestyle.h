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
