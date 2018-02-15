#ifndef STYLEPALETTE_H
#define STYLEPALETTE_H

#include <QDockWidget>

namespace Ui {
class StylePalette;
}

class StylePalette : public QDockWidget
{
    Q_OBJECT

public:
    explicit StylePalette(QWidget *parent = 0);
    ~StylePalette();

public slots:
    void on_buttonOpenProject_clicked();

private:
    Ui::StylePalette *ui;

protected:
    void closeEvent(QCloseEvent *event) override;
};

#endif // STYLEPALETTE_H
