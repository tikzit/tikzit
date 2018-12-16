#ifndef PREVIEWWINDOW_H
#define PREVIEWWINDOW_H

#include <QDialog>
#include <poppler/qt5/poppler-qt5.h>

namespace Ui {
class PreviewWindow;
}

class PreviewWindow : public QDialog
{
    Q_OBJECT

public:
    explicit PreviewWindow(QWidget *parent = nullptr);
    ~PreviewWindow();
    void resizeEvent(QResizeEvent *e);
    void showEvent(QShowEvent *e);
    void closeEvent(QCloseEvent *e);

private:
    Ui::PreviewWindow *ui;
    void render();
    Poppler::Document *_doc;
    Poppler::Page *_page;
};

#endif // PREVIEWWINDOW_H
