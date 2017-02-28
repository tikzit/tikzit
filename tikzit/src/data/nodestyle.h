#ifndef NODESTYLE_H
#define NODESTYLE_H

#include <QColor>

enum NodeShape {
    Square, UpTriangle, DownTriangle, Circle
};

class NodeStyle
{
public:
    NodeStyle();
    NodeStyle(QString nm, NodeShape sh, QColor fillCol);
    NodeStyle(QString nm, NodeShape sh, QColor fillCol, QColor strokeCol, int strokeThick);
    bool isNone();
    QString name;
    NodeShape shape;
    QColor fillColor;
    QColor strokeColor;
    int strokeThickness;
};

extern NodeStyle noneStyle;

#endif // NODESTYLE_H
