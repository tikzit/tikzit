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

private:
    Ui::StylePalette *ui;
};

#endif // STYLEPALETTE_H
