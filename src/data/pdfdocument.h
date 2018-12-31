#ifndef PDFDOCUMENT_H
#define PDFDOCUMENT_H

#include <QObject>
#include <QString>
#include <QLabel>

#include <poppler/qt5/poppler-qt5.h>

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
    Poppler::Document *_doc;
    Poppler::Page *_page;
};

#endif // PDFDOCUMENT_H
