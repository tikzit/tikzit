#ifndef PREVIEWWINDOW_H
#define PREVIEWWINDOW_H


#include <QDialog>
#include <QLabel>
#include <QPlainTextEdit>
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
    ~PreviewWindow();
    void setPdf(QString file);
    QString preparePreview(QString tikz);
    QPlainTextEdit *outputTextEdit();
    void setStatus(Status status);

public slots:
    void render();

protected:
    void resizeEvent(QResizeEvent *e);
    void showEvent(QShowEvent *e);
    void closeEvent(QCloseEvent *e);

private:
    Ui::PreviewWindow *ui;
    Poppler::Document *_doc;
    Poppler::Page *_page;
    QLabel *_loader;
};

#endif // PREVIEWWINDOW_H
