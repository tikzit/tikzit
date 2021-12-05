#include "pdfdocument.h"

#include <QFile>
#include <QByteArray>
#include <QDebug>
#include <QApplication>
#include <QClipboard>

#include <poppler/cpp/poppler-page-renderer.h>
#include <poppler/cpp/poppler-image.h>

using namespace poppler;

struct image_wrapper {
    image img;
};

static void poppler_cleanup(void *data) {
    image_wrapper *iw = static_cast<image_wrapper*>(data);
    delete(iw);
}

PdfDocument::PdfDocument(QString file, QObject *parent) : QObject(parent)
{
    _doc = document::load_from_file(file.toStdString());
    if (_doc != nullptr && _doc->pages() > 0) {
        _page = _doc->create_page(0);
    } else {
        _page = nullptr;
    }
}

void PdfDocument::renderTo(QLabel *label, QRect rect)
{
    if (!isValid()) return;
    qreal w0 = _page->page_rect().right() - _page->page_rect().left();
    qreal h0 = _page->page_rect().bottom() - _page->page_rect().top();
    qreal ratio = label->devicePixelRatioF();
    int w = static_cast<int>(ratio * (rect.width() - 20));
    int h = static_cast<int>(ratio * (rect.height() - 20));

    qreal hscale = static_cast<qreal>(w) / w0;
    qreal vscale = static_cast<qreal>(h) / h0;
    qreal scale = (hscale < vscale) ? hscale : vscale;

    int dpi = static_cast<int>(scale * 72.0);
    int w1 = static_cast<int>(scale * w0);
    int h1 = static_cast<int>(scale * h0);

    page_renderer renderer;
    renderer.set_render_hint(page_renderer::render_hint::antialiasing, true);
    renderer.set_render_hint(page_renderer::render_hint::text_antialiasing, true);
    renderer.set_render_hint(page_renderer::render_hint::text_hinting, true);
    renderer.set_image_format(image::format_argb32);
    image_wrapper *iw = new image_wrapper();
    iw->img = renderer.render_page(_page, dpi, dpi, (w1 - w)/2,  (h1 - h)/2, w, h);

    QImage qimg((const uchar*)iw->img.const_data(),
            iw->img.width(), iw->img.height(), iw->img.bytes_per_row(),
            QImage::Format_ARGB32,
            &poppler_cleanup, (void*)iw);

    QPixmap pm = QPixmap::fromImage(qimg);
    pm.setDevicePixelRatio(ratio);
    label->setPixmap(pm);
    // delete(data);
    // poppler_cleanup(img);
/*
    QSizeF pageSize = _page->pageSizeF();

    qreal ratio = label->devicePixelRatioF();
    int w = static_cast<int>(ratio * (rect.width() - 20));
    int h = static_cast<int>(ratio * (rect.height() - 20));

    // not all platforms have fmin, compute the min by hand
    qreal hscale = static_cast<qreal>(w) / pageSize.width();
    qreal vscale = static_cast<qreal>(h) / pageSize.height();
    qreal scale = (hscale < vscale) ? hscale : vscale;

    int dpi = static_cast<int>(scale * 72.0);
    int w1 = static_cast<int>(scale * pageSize.width());
    int h1 = static_cast<int>(scale * pageSize.height());

    //qDebug() << "hidpi ratio:" << ratio;
    //qDebug() << "visible width:" << w;
    //qDebug() << "visible height:" << h;
    //qDebug() << "doc width:" << pageSize.width();
    //qDebug() << "doc height:" << pageSize.height();
    //qDebug() << "scale:" << scale;
    //qDebug() << "dpi:" << dpi;

    QPixmap pm = QPixmap::fromImage(_page->renderToImage(dpi, dpi, (w1 - w)/2,  (h1 - h)/2, w, h));
    pm.setDevicePixelRatio(ratio);
    label->setPixmap(pm);
    */
}

bool PdfDocument::isValid()
{
    return (_page != nullptr);
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
    return _doc->save(file.toStdString());
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
    QSize pageSize = size();
    int dpix = (72 * outputSize.width()) / pageSize.width();
    int dpiy = (72 * outputSize.height()) / pageSize.height();

    page_renderer renderer;
    renderer.set_render_hint(page_renderer::render_hint::antialiasing, true);
    renderer.set_render_hint(page_renderer::render_hint::text_antialiasing, true);
    renderer.set_render_hint(page_renderer::render_hint::text_hinting, true);
    renderer.set_image_format(image::format_argb32);
    image_wrapper *iw = new image_wrapper();
    iw->img = renderer.render_page(_page, dpix, dpiy, 0,  0, outputSize.width(), outputSize.height());

    QImage qimg((const uchar*)iw->img.const_data(),
            iw->img.width(), iw->img.height(), iw->img.bytes_per_row(),
            QImage::Format_ARGB32,
            &poppler_cleanup, (void*)iw);
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
        int w = _page->page_rect().right() - _page->page_rect().left();
        int h = _page->page_rect().bottom() - _page->page_rect().top();
        return QSize(w, h);
    } else {
        return QSize();
    }
}


