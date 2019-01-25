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

#include "previewwindow.h"
#include "ui_previewwindow.h"

#include "tikzit.h"
#include "latexprocess.h"
#include "exportdialog.h"

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
#include <QAction>

PreviewWindow::PreviewWindow(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::PreviewWindow)
{

    ui->setupUi(this);

    _positionRestored = false;
    _doc = nullptr;

    _loader = new QLabel(ui->tabWidget->tabBar());
    _loader->setMinimumSize(QSize(16,16));
    _loader->setMaximumSize(QSize(16,16));
    _loader->setAutoFillBackground(false);
    ui->tabWidget->tabBar()->setTabButton(1, QTabBar::RightSide, _loader);
    
    connect(ui->tabWidget, SIGNAL(currentChanged(int)),
            this, SLOT(render()));

    render();
}

void PreviewWindow::contextMenuEvent(QContextMenuEvent *event)
{
    QMenu menu(this);
    QAction *act;

    act = new QAction("Export Image...");
    connect(act, SIGNAL(triggered()), this, SLOT(exportImage()));
    menu.addAction(act);

    act = new QAction("Copy to Clipboard");
    connect(act, SIGNAL(triggered()), this, SLOT(copyImageToClipboard()));
    menu.addAction(act);

    menu.exec(event->globalPos());
}

PdfDocument *PreviewWindow::doc() const
{
    return _doc;
}

PreviewWindow::~PreviewWindow()
{
    delete ui;
}

void PreviewWindow::restorePosition()
{
    // only restore position 1 time
    if (_positionRestored) return;

    QSettings settings("tikzit", "tikzit");
    QVariant geom = settings.value(QString("geometry-preview-qt") + qVersion());

    if (geom.isValid()) {
        restoreGeometry(geom.toByteArray());
    }
    _positionRestored = true;
}

void PreviewWindow::setPdf(QString file)
{
    // use loadFromData to avoid holding a lock on the PDF file in windows
    //QFile f(file);
    //f.open(QFile::ReadOnly);
    //QByteArray data = f.readAll();
    //f.close();
    PdfDocument *newDoc = new PdfDocument(file, this);

    if (newDoc->isValid()) {
        PdfDocument *oldDoc = _doc;
        _doc = newDoc;
        if (oldDoc != nullptr) delete oldDoc;
        render();
    } else {
        QMessageBox::warning(nullptr,
            "Could not read PDF",
            "Could not read: '" + file + "'.");
        delete newDoc;
    }
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
        QIcon accept(":images/dialog-accept.svg");
        //accept.setDevicePixelRatio(devicePixelRatio());
        _loader->setPixmap(accept.pixmap(QSize(16,16)));
    } else if (status == PreviewWindow::Failed) {
        _loader->setMovie(nullptr);
        QIcon error(":images/dialog-error.svg");
        //error.setDevicePixelRatio(devicePixelRatio());
        _loader->setPixmap(error.pixmap(QSize(16,16)));
    }

    if (oldMovie != nullptr) oldMovie->deleteLater();


    _loader->repaint();
}

void PreviewWindow::closeEvent(QCloseEvent *e) {
    QSettings settings("tikzit", "tikzit");
    settings.setValue(QString("geometry-preview-qt") + qVersion(), saveGeometry());
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
    if (_doc != nullptr) {
        _doc->renderTo(ui->pdf,
                       ui->scrollArea->visibleRegion().boundingRect());
        ui->pdf->repaint();
    }
}

void PreviewWindow::exportImage()
{
    QSettings settings("tikzit", "tikzit");
    if (_doc == nullptr) return;
    ExportDialog *d = new ExportDialog(this);
    int ret = d->exec();
    if (ret == QDialog::Accepted) {
        bool success;
        if (d->fileFormat() == ExportDialog::PDF) {
            success = _doc->exportPdf(d->filePath());
        } else {
            success = _doc->exportImage(
                        d->filePath(),
                        (d->fileFormat() == ExportDialog::PNG) ? "PNG" : "JPG",
                        d->size());
        }

        if (!success) {
            QMessageBox::warning(this,
                "Error",
                "Could not write to: '" + d->filePath() +
                   "'. Check file permissions or choose a new location.");
        }
    }
}

void PreviewWindow::copyImageToClipboard()
{
    if (_doc != nullptr) {
        _doc->copyImageToClipboard(_doc->size() * 4);
    }
}


