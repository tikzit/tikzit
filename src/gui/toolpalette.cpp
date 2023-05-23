/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
    setWindowTitle("Tools");
    setObjectName("toolPalette");
    //setGeometry(100,200,30,195);

    tools  = new QActionGroup(this);

    // select = new QAction(QIcon(":/images/Inkscape_icons_edit_select_all.svg"), "Select");
    // vertex = new QAction(QIcon(":/images/Inkscape_icons_draw_ellipse.svg"), "Add Vertex");
    // edge   = new QAction(QIcon(":/images/Inkscape_icons_draw_path.svg"), "Add Edge");
    // crop   = new QAction(QIcon(":/images/crop.svg"), "Bounding Box");

    select = new QAction("Select (s)", this);
    select->setIcon(QIcon(":/images/tikzit-tool-select.svg"));
    vertex = new QAction("Add Vertex (v)", this);
    vertex->setIcon(QIcon(":/images/tikzit-tool-node.svg"));
    edge   = new QAction("Add Edge (e)", this);
    edge->setIcon(QIcon(":/images/tikzit-tool-edge.svg"));


    tools->addAction(select);
    tools->addAction(vertex);
    tools->addAction(edge);
    //tools->addAction(crop);

    select->setCheckable(true);
    vertex->setCheckable(true);
    edge->setCheckable(true);
    //crop->setCheckable(true);
    select->setChecked(true);

    addAction(select);
    addAction(vertex);
    addAction(edge);
    //addAction(crop);
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
        /* crop->setChecked(true); */
        break;
    }
}

