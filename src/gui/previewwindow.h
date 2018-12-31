#ifndef PREVIEWWINDOW_H
#define PREVIEWWINDOW_H

#include "pdfdocument.h"

#include <QDialog>
#include <QLabel>
#include <QPlainTextEdit>
#include <QContextMenuEvent>
#include <poppler/qt5/poppler-qt5.h>

namespace Ui {
class PreviewWindow;
}

class PreviewWindow : public QDialog
{
    Q_OBJECT

public:
    enum Status {
        Running, Success, Failed
    };
    explicit PreviewWindow(QWidget *parent = nullptr);
    ~PreviewWindow() override;
    void setPdf(QString file);
    QString preparePreview(QString tikz);
    QPlainTextEdit *outputTextEdit();
    void setStatus(Status status);

    PdfDocument *doc() const;

public slots:
    void render();
    void exportImage();
    void copyImageToClipboard();

protected:
    void resizeEvent(QResizeEvent *e) override;
    void showEvent(QShowEvent *e) override;
    void closeEvent(QCloseEvent *e) override;
    void contextMenuEvent(QContextMenuEvent *event) override;
private:
    Ui::PreviewWindow *ui;
    PdfDocument *_doc;
    QLabel *_loader;
};

#endif // PREVIEWWINDOW_H
