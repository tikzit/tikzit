#ifndef STYLEPALETTE_H
#define STYLEPALETTE_H

#include <QDockWidget>
#include <QStandardItemModel>

namespace Ui {
class StylePalette;
}

class StylePalette : public QDockWidget
{
    Q_OBJECT

public:
    explicit StylePalette(QWidget *parent = 0);
    ~StylePalette();
    void reloadStyles();

public slots:
    void on_buttonOpenTikzstyles_clicked();

private:
    Ui::StylePalette *ui;
    QStandardItemModel *_model;

protected:
    void closeEvent(QCloseEvent *event) override;
};

#endif // STYLEPALETTE_H
