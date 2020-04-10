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
#include <QMessageBox>

StylePalette::StylePalette(QWidget *parent) :
    QDockWidget(parent),
    ui(new Ui::StylePalette)
{
    ui->setupUi(this);
    _lastStyleIndex = 0;
    _lastEdgeStyleIndex = 0;

    ui->styleListView->setModel(tikzit->styles()->nodeStyles());
    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(48,48));


    ui->edgeStyleListView->setModel(tikzit->styles()->edgeStyles());
    ui->edgeStyleListView->setViewMode(QListView::IconMode);
    ui->edgeStyleListView->setMovement(QListView::Static);
    ui->edgeStyleListView->setGridSize(QSize(48,48));

    reloadStyles();

    connect(ui->styleListView, SIGNAL(doubleClicked(const QModelIndex &)), this, SLOT( nodeStyleDoubleClicked(const QModelIndex&)) );
	connect(ui->edgeStyleListView, SIGNAL(doubleClicked(const QModelIndex &)), this, SLOT(edgeStyleDoubleClicked(const QModelIndex&)));
}

StylePalette::~StylePalette()
{
    delete ui;
}

void StylePalette::reloadStyles()
{
    QString f = tikzit->styleFile();
    ui->styleFile->setText(f);

    ui->styleListView->setModel(tikzit->styles()->nodeStyles());
    ui->edgeStyleListView->setModel(tikzit->styles()->edgeStyles());

    QString cat = ui->currentCategory->currentText();
    ui->currentCategory->clear();

	// TODO: styleFile() should return invalid string if no style file loaded
    if (f != "[no styles]") {
		ui->currentCategory->addItems(tikzit->styles()->categories());
		ui->currentCategory->setCurrentText(cat);
	}

    clearNodeStyle();
    clearEdgeStyle();
}

int StylePalette::styleIndex()
{
    QModelIndexList i = ui->styleListView->selectionModel()->selectedIndexes();
    if (!i.isEmpty()) return i[0].row();
    else return 0;
}

void StylePalette::setStyleIndex(int i)
{
    _lastStyleIndex = styleIndex();
    if (i < 0) {
        i = 0;
    } else {
        int max = tikzit->styles()->nodeStyles()->numInCategory();
        if (i >= max) i = max - 1;
    }

    QModelIndex i1 =tikzit->styles()->nodeStyles()->index(i,0);
    ui->styleListView->selectionModel()->select(i1, QItemSelectionModel::ClearAndSelect);
    ui->styleListView->scrollTo(i1);
}

int StylePalette::edgeStyleIndex()
{
    QModelIndexList i = ui->edgeStyleListView->selectionModel()->selectedIndexes();
    if (!i.isEmpty()) return i[0].row();
    else return 0;
}

void StylePalette::setEdgeStyleIndex(int i)
{
    _lastEdgeStyleIndex = edgeStyleIndex();
    if (i < 0) {
        i = 0;
    } else {
        int max = tikzit->styles()->edgeStyles()->numInCategory();
        if (i >= max) i = max - 1;
    }

    QModelIndex i1 =tikzit->styles()->edgeStyles()->index(i,0);
    ui->edgeStyleListView->selectionModel()->select(i1, QItemSelectionModel::ClearAndSelect);
    ui->edgeStyleListView->scrollTo(i1);
}

void StylePalette::nextNodeStyle()
{
    setStyleIndex(styleIndex()+1);
}

void StylePalette::previousNodeStyle()
{
    setStyleIndex(styleIndex()-1);
}

void StylePalette::clearNodeStyle()
{
    setStyleIndex(0);
}

void StylePalette::toggleClearNodeStyle()
{
    if (styleIndex() == 0) setStyleIndex(_lastStyleIndex);
    else setStyleIndex(0);
}

void StylePalette::nextEdgeStyle()
{
    setEdgeStyleIndex(edgeStyleIndex()+1);
}

void StylePalette::previousEdgeStyle()
{
    setEdgeStyleIndex(edgeStyleIndex()-1);
}

void StylePalette::clearEdgeStyle()
{
    setEdgeStyleIndex(0);
}

void StylePalette::toggleClearEdgeStyle()
{
    if (edgeStyleIndex() == 0) setEdgeStyleIndex(_lastEdgeStyleIndex);
    else setEdgeStyleIndex(0);
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

void StylePalette::nodeStyleDoubleClicked(const QModelIndex &)
{
    tikzit->activeWindow()->tikzScene()->applyActiveStyleToNodes();
}

void StylePalette::edgeStyleDoubleClicked(const QModelIndex &)
{
    tikzit->activeWindow()->tikzScene()->applyActiveStyleToEdges();
}

void StylePalette::on_buttonNewTikzstyles_clicked()
{
    tikzit->newTikzStyles();
}

void StylePalette::on_buttonOpenTikzstyles_clicked()
{
    tikzit->openTikzStyles();
}

void StylePalette::on_buttonEditTikzstyles_clicked()
{
    if (tikzit->styleFile() != "[no styles]") {
        tikzit->showStyleEditor();
    } else {
        QMessageBox::warning(0,
            "No style file",
            "You cannot edit styles until a style file is loaded. Either create a new style file or load an existing one.");
    }
}

void StylePalette::on_buttonRefreshTikzstyles_clicked()
{
    QSettings settings("tikzit", "tikzit");
    QString path = settings.value("previous-tikzstyles-file").toString();
    if (!path.isEmpty()) tikzit->loadStyles(path);
}

void StylePalette::on_currentCategory_currentTextChanged(const QString &cat)
{
    //tikzit->styles()->refreshModels(_nodeModel, _edgeModel, cat);
    tikzit->styles()->nodeStyles()->setCategory(cat);
    clearNodeStyle();
}

//void StylePalette::on_buttonApplyNodeStyle_clicked()
//{
//    if (tikzit->activeWindow() != 0) tikzit->activeWindow()->tikzScene()->applyActiveStyleToNodes();
//}


void StylePalette::resizeEvent(QResizeEvent *event)
{
    QDockWidget::resizeEvent(event);
    ui->styleListView->setGridSize(QSize(48,48));
    ui->edgeStyleListView->setGridSize(QSize(48,48));
}
