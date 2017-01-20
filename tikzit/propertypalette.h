#ifndef PROPERTYPALETTE_H
#define PROPERTYPALETTE_H

#include <QDockWidget>

namespace Ui {
class PropertyPalette;
}

class PropertyPalette : public QDockWidget
{
    Q_OBJECT

public:
    explicit PropertyPalette(QWidget *parent = 0);
    ~PropertyPalette();

private:
    Ui::PropertyPalette *ui;
};

#endif // PROPERTYPALETTE_H
