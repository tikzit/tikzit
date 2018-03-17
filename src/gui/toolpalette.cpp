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
    //setGeometry(100,200,30,195);

    tools  = new QActionGroup(this);

    select = new QAction(QIcon(":/images/Inkscape_icons_edit_select_all.svg"), "Select");
    vertex = new QAction(QIcon(":/images/Inkscape_icons_draw_ellipse.svg"), "Add Vertex");
    edge   = new QAction(QIcon(":/images/Inkscape_icons_draw_path.svg"), "Add Edge");
    crop   = new QAction(QIcon(":/images/crop.svg"), "Bounding Box");

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

ToolPalette::Tool ToolPalette::currentTool() const
{
    QAction *a = tools->checkedAction();
    if (a == vertex) return VERTEX;
    else if (a == edge) return EDGE;
    else if (a == crop) return CROP;
    else return SELECT;
}

void ToolPalette::setCurrentTool(ToolPalette::Tool tool)
{
    switch(tool) {
    case SELECT:
        select->setChecked(true);
        break;
    case VERTEX:
        vertex->setChecked(true);
        break;
    case EDGE:
        edge->setChecked(true);
        break;
    case CROP:
        crop->setChecked(true);
        break;
    }
}

