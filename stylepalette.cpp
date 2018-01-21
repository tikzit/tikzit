#include "stylepalette.h"
#include "ui_stylepalette.h"

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
