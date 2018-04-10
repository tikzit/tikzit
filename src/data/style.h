#ifndef STYLE_H
#define STYLE_H


#include "graphelementdata.h"

#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class Style
{
public:
    Style();
    Style(QString name, GraphElementData *data);
    bool isNone();

    // properties that both edges and nodes have
    GraphElementData *data() const;
    QString name() const;
    QColor strokeColor() const;
    int strokeThickness() const;

    // methods that are implemented differently for edges and nodes
    virtual QPen pen() const;
    virtual QPainterPath path() const = 0;
    virtual QPainterPath palettePath() const = 0;
    virtual QIcon icon() const = 0;
protected:
    QString propertyWithDefault(QString prop, QString def) const;
    QString _name;
    GraphElementData *_data;
};
#endif // STYLE_H
