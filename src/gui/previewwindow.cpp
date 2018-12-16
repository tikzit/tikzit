#include "previewwindow.h"
#include "ui_previewwindow.h"

#include <QLabel>
#include <QImage>
#include <QPixmap>
#include <QDebug>
#include <QRegion>
#include <QSettings>
#include <cmath>

PreviewWindow::PreviewWindow(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::PreviewWindow)
{
    QSettings settings("tikzit", "tikzit");
    ui->setupUi(this);

    QVariant geom = settings.value("geometry-preview");

    if (geom.isValid()) {
        restoreGeometry(geom.toByteArray());
    }

    _doc = Poppler::Document::load("/home/aleks/ak-algebras.pdf");
    _doc->setRenderHint(Poppler::Document::Antialiasing);
    _doc->setRenderHint(Poppler::Document::TextAntialiasing);
    _doc->setRenderHint(Poppler::Document::TextHinting	);
    _page = _doc->page(0);
    
    render();
}

PreviewWindow::~PreviewWindow()
{
    delete ui;
}

void PreviewWindow::closeEvent(QCloseEvent *e) {
    QSettings settings("tikzit", "tikzit");
    settings.setValue("geometry-preview", saveGeometry());
}

void PreviewWindow::resizeEvent(QResizeEvent *e) {
    render();
    QDialog::resizeEvent(e);
}

void PreviewWindow::showEvent(QShowEvent *e) {
    render();
    QDialog::showEvent(e);
}

void PreviewWindow::render() {
    QSizeF size = _page->pageSizeF();

    QRect rect = ui->scrollArea->visibleRegion().boundingRect();
    int w = rect.width();
    int h = rect.height();
    qreal scale = fmin(static_cast<qreal>(w) / size.width(),
                       static_cast<qreal>(h) / size.height());
    int dpi = static_cast<int>(scale * 72.0);
    int w1 = static_cast<int>(scale * size.width());
    int h1 = static_cast<int>(scale * size.height());

    // qDebug() << "visible width:" << w;
    // qDebug() << "visible height:" << h;
    // qDebug() << "doc width:" << size.width();
    // qDebug() << "doc height:" << size.height();
    // qDebug() << "scale:" << scale;
    // qDebug() << "dpi:" << dpi;

    QImage img = _page->renderToImage(dpi,dpi, (w1 - w)/2,  (h1 - h)/2, w, h);
    ui->pdf->setPixmap(QPixmap::fromImage(img));
}
