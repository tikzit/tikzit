#include "toolpalette.h"

#include <QVector>
#include <QLayout>
#include <QVBoxLayout>
#include <QDebug>

ToolPalette::ToolPalette(QWidget *parent) :
    QToolBar(parent)
{
    setWindowFlags(Qt::Window
                   | Qt::CustomizeWindowHint
                   | Qt::WindowDoesNotAcceptFocus);
    setOrientation(Qt::Vertical);
    setFocusPolicy(Qt::NoFocus);
    setGeometry(100,200,30,195);

    tools  = new QActionGroup(this);

    select = new QAction(QIcon(":/images/select-rectangular.png"), "Select");
    vertex = new QAction(QIcon(":/images/draw-ellipse.png"), "Add Vertex");
    edge   = new QAction(QIcon(":/images/draw-path.png"), "Add Edge");
    crop   = new QAction(QIcon(":/images/transform-crop-and-resize.png"), "Bounding Box");

    tools->addAction(select);
    tools->addAction(vertex);
    tools->addAction(edge);
    tools->addAction(crop);

    select->setCheckable(true);
    vertex->setCheckable(true);
    edge->setCheckable(true);
    crop->setCheckable(true);
    select->setChecked(true);

    addAction(select);
    addAction(vertex);
    addAction(edge);
    addAction(crop);
}

