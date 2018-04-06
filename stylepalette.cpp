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

    _model = new QStandardItemModel(this);
    ui->styleListView->setModel(_model);
    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(70,40));

    reloadStyles();

    connect(ui->styleListView, SIGNAL(doubleClicked(const QModelIndex &)), this, SLOT( itemDoubleClicked(const QModelIndex&)) );
}

StylePalette::~StylePalette()
{
    delete ui;
}

void StylePalette::reloadStyles()
{
    _model->clear();
    QString f = tikzit->styleFile();
    //
    ui->styleFile->setText(f);

    QStandardItem *it;
    //QSize sz(60,60);

    it = new QStandardItem(noneStyle->icon(), noneStyle->name());
    it->setEditable(false);
    it->setData(noneStyle->name());
    _model->appendRow(it);

    foreach(NodeStyle *ns, tikzit->styles()->nodeStyles()) {
        it = new QStandardItem(ns->icon(), ns->name());
        it->setEditable(false);
        it->setData(ns->name());
        _model->appendRow(it);
    }
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

void StylePalette::itemDoubleClicked(const QModelIndex &index)
{
    tikzit->activeWindow()->tikzScene()->applyActiveStyleToNodes();
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
