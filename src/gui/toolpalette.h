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

/*!
  * A small window that lets the user select the current editing tool.
  */

#ifndef TOOLPALETTE_H
#define TOOLPALETTE_H

#include <QObject>
#include <QToolBar>
#include <QAction>
#include <QActionGroup>

class ToolPalette : public QToolBar
{
    Q_OBJECT
public:
    ToolPalette(QWidget *parent = 0);
    enum Tool {
        SELECT,
        VERTEX,
        EDGE,
        CROP
    };

    Tool currentTool() const;
    void setCurrentTool(Tool tool);
private:
    QActionGroup *tools;
    QAction *select;
    QAction *vertex;
    QAction *edge;
    QAction *crop;
};

#endif // TOOLPALETTE_H
