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
  * Enables the user to edit properties of the graph, as well as the selected node/edge.
  */

#ifndef PROPERTYPALETTE_H
#define PROPERTYPALETTE_H

#include <QDockWidget>

namespace Ui {
class PropertyPalette;
}

class PropertyPalette : public QDockWidget
{
    Q_OBJECT

public:
    explicit PropertyPalette(QWidget *parent = 0);
    ~PropertyPalette();

protected:
    void closeEvent(QCloseEvent *event);
private:
    Ui::PropertyPalette *ui;
};

#endif // PROPERTYPALETTE_H
