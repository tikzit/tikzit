#include "pdfdocument.h"

#include <QFile>
#include <QByteArray>
#include <QDebug>
#include <QApplication>
#include <QClipboard>

PdfDocument::PdfDocument(QString file, QObject *parent) : QObject(parent)
{
    _doc1 = new QPdfDocument(this);
    QFile f(file);
    f.open(QIODevice::ReadOnly);
    _doc1->load(&f);
    f.close();
    //_doc1->load(file);
}

void PdfDocument::renderTo(QLabel *label, QRect rect)
{
    if (!isValid()) return;
    QSizeF sz = _doc1->pagePointSize(0);
    qreal w0 = sz.width();
    qreal h0 = sz.height();
    qreal ratio = label->devicePixelRatioF();
    int w = static_cast<int>(ratio * (rect.width() - 20));
    int h = static_cast<int>(ratio * (rect.height() - 20));

    qreal hscale = static_cast<qreal>(w) / w0;
    qreal vscale = static_cast<qreal>(h) / h0;
    qreal scale = (hscale < vscale) ? hscale : vscale;

    int w1 = static_cast<int>(scale * w0);
    int h1 = static_cast<int>(scale * h0);
    QImage qimg = _doc1->render(0, QSize(w1, h1));
    QPixmap pm = QPixmap::fromImage(qimg);
    pm.setDevicePixelRatio(ratio);
    label->setPixmap(pm);
    label->setAlignment(Qt::AlignCenter);
    label->setStyleSheet("QLabel {background-color: white}");
}

bool PdfDocument::isValid()
{
    return _doc1->pageCount() > 0;
}

bool PdfDocument::exportImage(QString file, const char *format, QSize outputSize)
{
    QImage img = asImage(outputSize);
    if (!img.isNull()) return img.save(file, format);
    else return false;
}

bool PdfDocument::exportPdf(QString file)
{
    if (!isValid()) return false;
//    return _doc->save(file.toStdString());
    return false;
}

void PdfDocument::copyImageToClipboard(QSize outputSize)
{
    QImage img = asImage(outputSize);
    if (!img.isNull()) {
        QApplication::clipboard()->setImage(img, QClipboard::Clipboard);
    }
}

QImage PdfDocument::asImage(QSize outputSize)
{
    if (!isValid()) return QImage();
    if (outputSize.isNull()) outputSize = size();
    QImage qimg = _doc1->render(0, outputSize);
    return qimg;
}

// CRASHES TikZiT when figures contain text, due to limitations of Arthur backend
//void PdfDocument::exportToSvg(QString file, QSize size) {
//    QSvgGenerator gen;
//    gen.setFileName(file);
//    gen.setSize(size);
//    gen.setViewBox(QRect(0,0,size.width(),size.height()));
//    gen.setDescription("SVG generated from PDF by TikZiT");
//    QPainter painter;

//    // set the backend to Qt for renderToPainter() support
//    Poppler::Document::RenderBackend backend = _doc->renderBackend();
//    _doc->setRenderBackend(Poppler::Document::ArthurBackend);
//    painter.begin(&gen);
//    _page->renderToPainter(&painter);
//    painter.end();
//    _doc->setRenderBackend(backend);
//}

QSize PdfDocument::size()
{
    if (isValid()) {
        QSizeF sizef = _doc1->pagePointSize(0);
        return QSize(static_cast<int>(sizef.width()), static_cast<int>(sizef.height()));
    } else {
        return QSize();
    }
}


