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

#include "propertypalette.h"
#include "graphelementdata.h"
#include "ui_propertypalette.h"

#include <QModelIndex>
#include <QDebug>
#include <QCloseEvent>
#include <QSettings>

PropertyPalette::PropertyPalette(QWidget *parent) :
    QDockWidget(parent),
    ui(new Ui::PropertyPalette)
{
    setWindowFlags(Qt::Window
                   | Qt::CustomizeWindowHint
                   | Qt::WindowTitleHint);
    //setFocusPolicy(Qt::NoFocus);
    ui->setupUi(this);
    GraphElementData *d = new GraphElementData();
    d->setProperty("key 1", "value 1");
    d->setAtom("atom 1");
    d->setProperty("key 2", "value 2");

    //QModelIndex i = d->index(0,0);
    //ui->treeView->setModel(d);

    QSettings settings("tikzit", "tikzit");
    QVariant geom = settings.value("property-palette-geometry");
    if (geom != QVariant()) {
        restoreGeometry(geom.toByteArray());
    }
}

PropertyPalette::~PropertyPalette()
{
    delete ui;
}

void PropertyPalette::closeEvent(QCloseEvent *event) {
    QSettings settings("tikzit", "tikzit");
    settings.setValue("property-palette-geometry", saveGeometry());
    QDockWidget::closeEvent(event);
}
