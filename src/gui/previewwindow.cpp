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
#include <QMovie>

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

    _loader = new QLabel(this);
    _loader->setMinimumSize(QSize(16,16));
    _loader->setMaximumSize(QSize(16,16));
    ui->tabWidget->tabBar()->setTabButton(1, QTabBar::RightSide, _loader);
    
    connect(ui->tabWidget, SIGNAL(currentChanged(int)),
            this, SLOT(render()));

    render();
}

PreviewWindow::~PreviewWindow()
{
    delete ui;
}

void PreviewWindow::setPdf(QString file)
{
    Poppler::Document *oldDoc = _doc;

    // use loadFromData to avoid holding a lock on the PDF file in windows
    QFile f(file);
    f.open(QFile::ReadOnly);
    QByteArray data = f.readAll();
    f.close();
    Poppler::Document *newDoc = Poppler::Document::loadFromData(data);

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

void PreviewWindow::setStatus(PreviewWindow::Status status)
{
    QMovie *oldMovie = _loader->movie();
    if (status == PreviewWindow::Running) {
        // loader.gif and loader@2x.gif derived from:
        //   https://commons.wikimedia.org/wiki/Throbbers#/media/File:Linux_Ubuntu_Loader.gif
        // licensed GNU Free Documentation License v1.2
        QMovie *movie = new QMovie(
                    (devicePixelRatioF() > 1.0) ? ":images/loader@2x.gif" : ":images/loader.gif",
                    QByteArray(), _loader);
        _loader->setPixmap(QPixmap());
        _loader->setMovie(movie);
        movie->start();
    } else if (status == PreviewWindow::Success) {
        _loader->setMovie(nullptr);
        QPixmap accept(":images/dialog-accept.svg");
        accept.setDevicePixelRatio(3.0);
        _loader->setPixmap(accept);
    } else if (status == PreviewWindow::Failed) {
        _loader->setMovie(nullptr);
        QPixmap error(":images/dialog-error.svg");
        error.setDevicePixelRatio(3.0);
        _loader->setPixmap(error);
    }

    if (oldMovie != nullptr) oldMovie->deleteLater();


    _loader->repaint();
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

    qreal ratio = devicePixelRatioF();
    QRect rect = ui->scrollArea->visibleRegion().boundingRect();
    int w = static_cast<int>(ratio * (rect.width() - 20));
    int h = static_cast<int>(ratio * (rect.height() - 20));
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

    QPixmap pm = QPixmap::fromImage(_page->renderToImage(dpi, dpi, (w1 - w)/2,  (h1 - h)/2, w, h));
    pm.setDevicePixelRatio(ratio);
    ui->pdf->setPixmap(pm);
}
