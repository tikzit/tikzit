#ifndef EXPORTDIALOG_H
#define EXPORTDIALOG_H

#include <QDialog>

namespace Ui {
class ExportDialog;
}

class ExportDialog : public QDialog
{
    Q_OBJECT

public:
    explicit ExportDialog(QWidget *parent = nullptr);
    ~ExportDialog();
    enum Format {
        PNG = 0,
        JPG = 1,
        PDF = 2
    };

protected slots:
    void setHeightFromWidth();
    void setWidthFromHeight();
    void on_keepAspect_stateChanged(int state);
    void on_browseButton_clicked();
    void on_fileFormat_currentIndexChanged(int f);

private:
    Ui::ExportDialog *ui;
};

#endif // EXPORTDIALOG_H
