#include "stylepalette.h"
#include "ui_stylepalette.h"

#include <QDebug>
#include <QSettings>

StylePalette::StylePalette(QWidget *parent) :
    QDockWidget(parent),
    ui(new Ui::StylePalette)
{
    ui->setupUi(this);

    QSettings settings("tikzit", "tikzit");
    QVariant geom = settings.value("style-palette-geometry");
    if (geom != QVariant()) {
        restoreGeometry(geom.toByteArray());
    }
}

StylePalette::~StylePalette()
{
    delete ui;
}

void StylePalette::on_buttonOpenProject_clicked()
{
    qDebug() << "got click";
}

void StylePalette::closeEvent(QCloseEvent *event)
{
    QSettings settings("tikzit", "tikzit");
    settings.setValue("style-palette-geometry", saveGeometry());
    QDockWidget::closeEvent(event);
}
