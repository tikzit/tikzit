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

#include "stylepalette.h"
#include "ui_stylepalette.h"
#include "tikzit.h"

#include <QDebug>
#include <QIcon>
#include <QSize>
#include <QSettings>
#include <QPainter>
#include <QPixmap>
#include <QPainterPath>

StylePalette::StylePalette(QWidget *parent) :
    QDockWidget(parent),
    ui(new Ui::StylePalette)
{
    ui->setupUi(this);

//    QSettings settings("tikzit", "tikzit");
//    QVariant geom = settings.value("style-palette-geometry");
//    if (geom != QVariant()) {
//        restoreGeometry(geom.toByteArray());
//    }

    _nodeModel = new QStandardItemModel(this);
    _edgeModel = new QStandardItemModel(this);

    ui->styleListView->setModel(_nodeModel);
    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(70,40));

    ui->edgeStyleListView->setModel(_edgeModel);
    ui->edgeStyleListView->setViewMode(QListView::IconMode);
    ui->edgeStyleListView->setMovement(QListView::Static);
    ui->edgeStyleListView->setGridSize(QSize(70,40));

    reloadStyles();

    connect(ui->styleListView, SIGNAL(doubleClicked(const QModelIndex &)), this, SLOT( nodeStyleDoubleClicked(const QModelIndex&)) );
}

StylePalette::~StylePalette()
{
    delete ui;
}

void StylePalette::reloadStyles()
{
    _nodeModel->clear();
    _edgeModel->clear();
    QString f = tikzit->styleFile();
    ui->styleFile->setText(f);

    QStandardItem *it;

    it = new QStandardItem(noneStyle->icon(), noneStyle->name());
    it->setEditable(false);
    it->setData(noneStyle->name());
    _nodeModel->appendRow(it);

    foreach(NodeStyle *ns, tikzit->styles()->nodeStyles()) {
        it = new QStandardItem(ns->icon(), ns->name());
        it->setEditable(false);
        it->setData(ns->name());
        _nodeModel->appendRow(it);
    }

    it = new QStandardItem(noneEdgeStyle->icon(), noneEdgeStyle->name());
    it->setEditable(false);
    it->setData(noneEdgeStyle->name());
    _edgeModel->appendRow(it);

    foreach(EdgeStyle *es, tikzit->styles()->edgeStyles()) {
        it = new QStandardItem(es->icon(), es->name());
        it->setEditable(false);
        it->setData(es->name());
        _edgeModel->appendRow(it);
    }
}

void StylePalette::changeNodeStyle(int increment)
{
    QModelIndexList i = ui->styleListView->selectionModel()->selectedIndexes();
    int row = 0;
    if (!i.isEmpty()) {
        int row = (i[0].row()+increment)%_nodeModel->rowCount();
        if (row < 0) row += _nodeModel->rowCount();
    }

    QModelIndex i1 = ui->styleListView->rootIndex().child(row, 0);
    ui->styleListView->selectionModel()->select(i1, QItemSelectionModel::ClearAndSelect);
    ui->styleListView->scrollTo(i1);
}

void StylePalette::nextNodeStyle()
{
    changeNodeStyle(1);
}

void StylePalette::previousNodeStyle()
{
    changeNodeStyle(-1);
}

QString StylePalette::activeNodeStyleName()
{
    const QModelIndexList i = ui->styleListView->selectionModel()->selectedIndexes();

    if (i.isEmpty()) {
        return "none";
    } else {
        return i[0].data().toString();
    }
}

QString StylePalette::activeEdgeStyleName()
{
	const QModelIndexList i = ui->edgeStyleListView->selectionModel()->selectedIndexes();

	if (i.isEmpty()) {
		return "none";
	} else {
		return i[0].data().toString();
	}
}

void StylePalette::nodeStyleDoubleClicked(const QModelIndex &index)
{
    tikzit->activeWindow()->tikzScene()->applyActiveStyleToNodes();
}

void StylePalette::edgeStyleDoubleClicked(const QModelIndex &index)
{
    // TODO
}

void StylePalette::on_buttonOpenTikzstyles_clicked()
{
    tikzit->openTikzStyles();
}

void StylePalette::on_buttonRefreshTikzstyles_clicked()
{
    QSettings settings("tikzit", "tikzit");
    QString path = settings.value("previous-tikzstyles-file").toString();
    if (!path.isEmpty()) tikzit->loadStyles(path);
}

//void StylePalette::on_buttonApplyNodeStyle_clicked()
//{
//    if (tikzit->activeWindow() != 0) tikzit->activeWindow()->tikzScene()->applyActiveStyleToNodes();
//}

void StylePalette::closeEvent(QCloseEvent *event)
{
    QSettings settings("tikzit", "tikzit");
    settings.setValue("style-palette-geometry", saveGeometry());
    QDockWidget::closeEvent(event);
}
