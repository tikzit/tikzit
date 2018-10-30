#ifndef PREVIEWWINDOW_H
#define PREVIEWWINDOW_H

#include <QDialog>

namespace Ui {
class PreviewWindow;
}

class PreviewWindow : public QDialog
{
    Q_OBJECT

public:
    explicit PreviewWindow(QWidget *parent = nullptr);
    ~PreviewWindow();

private:
    Ui::PreviewWindow *ui;
};

#endif // PREVIEWWINDOW_H
