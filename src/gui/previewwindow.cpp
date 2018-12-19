#include "previewwindow.h"
#include "ui_previewwindow.h"

#include "tikzit.h"
#include "latexprocess.h"

#include <QLabel>
#include <QImage>
#include <QPixmap>
#include <QDebug>
#include <QSettings>
#include <QTemporaryDir>
#include <QFile>
#include <QTextStream>
#include <QStandardPaths>
#include <QMessageBox>
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

    _doc = nullptr;
    _page = nullptr;
    //setPdf("/home/aleks/ak-algebras.pdf");

    //qDebug() << "preview dir:" << preparePreview("foo");
    
    render();
}

PreviewWindow::~PreviewWindow()
{
    delete ui;
}

void PreviewWindow::setPdf(QString file)
{
    Poppler::Document *oldDoc = _doc;
    Poppler::Document *newDoc = Poppler::Document::load(file);
    if (!newDoc) {
        QMessageBox::warning(nullptr,
            "Could not read PDF",
            "Could not read: '" + file + "'.");
        return;
    }

    _doc = newDoc;
    _doc->setRenderHint(Poppler::Document::Antialiasing);
    _doc->setRenderHint(Poppler::Document::TextAntialiasing);
    _doc->setRenderHint(Poppler::Document::TextHinting	);
    _page = _doc->page(0);
    render();

    if (oldDoc != nullptr) delete oldDoc;
}

QPlainTextEdit *PreviewWindow::outputTextEdit()
{
    return ui->output;
}

void PreviewWindow::closeEvent(QCloseEvent *e) {
    QSettings settings("tikzit", "tikzit");
    settings.setValue("geometry-preview", saveGeometry());
    QDialog::closeEvent(e);
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
    if (_page == nullptr) return;

    QSizeF size = _page->pageSizeF();

    QRect rect = ui->scrollArea->visibleRegion().boundingRect();
    int w = rect.width() - 20;
    int h = rect.height() - 20;
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

    QImage img = _page->renderToImage(dpi, dpi, (w1 - w)/2,  (h1 - h)/2, w, h);
    ui->pdf->setPixmap(QPixmap::fromImage(img));
}
