#include "nodestyle.h"

NodeStyle::NodeStyle()
{
    name = "none";
    shape = NodeShape::Circle;
    fillColor = Qt::white;
    strokeColor = Qt::black;
    strokeThickness = 1;
}

NodeStyle::NodeStyle(QString nm, NodeShape sh, QColor fillCol)
{
    name = nm;
    shape = sh;
    fillColor = fillCol;
    strokeColor = Qt::black;
    strokeThickness = 1;
}

NodeStyle::NodeStyle(QString nm, NodeShape sh, QColor fillCol, QColor strokeCol, int strokeThick)
{
    name = nm;
    shape = sh;
    fillColor = fillCol;
    strokeColor = strokeCol;
    strokeThickness = strokeThick;
}

bool NodeStyle::isNone() { return name == "none"; }
