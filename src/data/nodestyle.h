#ifndef NODESTYLE_H
#define NODESTYLE_H

#include "graphelementdata.h"

#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class NodeStyle
{
public:
    enum Shape {
        Rectangle, UpTriangle, DownTriangle, Circle
    };

    NodeStyle();
    NodeStyle(QString name, GraphElementData *data);
    bool isNone();

    GraphElementData *data() const;
    QString name() const;
    Shape shape() const;
    QColor fillColor() const;
    QColor strokeColor() const;
    int strokeThickness() const;

    QPen pen() const;
    QBrush brush() const;
    QPainterPath path() const;
    QPainterPath palettePath() const;
    QIcon icon() const;
private:
    QString _name;
    GraphElementData *_data;
};

extern NodeStyle *noneStyle;

#endif // NODESTYLE_H
