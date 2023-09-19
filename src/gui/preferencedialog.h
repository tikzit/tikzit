#ifndef PREFERENCEDIALOG_H
#define PREFERENCEDIALOG_H

#include <QDialog>

namespace Ui {
class PreferenceDialog;
}

class PreferenceDialog : public QDialog
{
    Q_OBJECT

public:
    explicit PreferenceDialog(QWidget *parent = nullptr);
    ~PreferenceDialog() override;

protected slots:
    void accept() override;
    void colorClick();
    void sourceFontPickClick();
    void on_resetColors_clicked();
    void on_autoPdflatex_stateChanged(int state);
    void on_browsePdflatex_clicked();

private:
    Ui::PreferenceDialog *ui;
    QColor color(QPushButton *btn);
    void setColor(QPushButton *btn, QColor col);
};

#endif // PREFERENCEDIALOG_H
