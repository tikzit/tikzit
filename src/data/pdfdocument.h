#ifndef PDFDOCUMENT_H
#define PDFDOCUMENT_H

#include <QObject>
#include <QString>
#include <QLabel>

#include <poppler/cpp/poppler-document.h>
#include <poppler/cpp/poppler-page.h>

/* #include <poppler/qt6/poppler-qt6.h> */

class PdfDocument : public QObject
{
    Q_OBJECT
public:
    explicit PdfDocument(QString file, QObject *parent = nullptr);
    void renderTo(QLabel *label, QRect rect);
    bool isValid();
//    void exportToSvg(QString file, QSize size);
    bool exportImage(QString file, const char *format, QSize outputSize=QSize());
    bool exportPdf(QString file);
    void copyImageToClipboard(QSize outputSize=QSize());
    QImage asImage(QSize outputSize=QSize());
    QSize size();
private:
    poppler::document *_doc;
    poppler::page *_page;
};

#endif // PDFDOCUMENT_H
