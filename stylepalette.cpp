#include "stylepalette.h"
#include "ui_stylepalette.h"

#include <QDebug>

StylePalette::StylePalette(QWidget *parent) :
    QDockWidget(parent),
    ui(new Ui::StylePalette)
{
    ui->setupUi(this);
}

StylePalette::~StylePalette()
{
    delete ui;
}

void StylePalette::on_buttonOpenProject_clicked()
{
    qDebug() << "got click";
}
