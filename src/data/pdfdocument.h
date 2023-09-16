#ifndef PDFDOCUMENT_H
#define PDFDOCUMENT_H

#include <QObject>
#include <QString>
#include <QLabel>
#include <QPdfDocument>

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
    QPdfDocument *_doc1;
    QByteArray _data;
};

#endif // PDFDOCUMENT_H
