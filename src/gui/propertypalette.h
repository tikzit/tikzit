/**
  * Enables the user to edit properties of the graph, as well as the selected node/edge.
  */

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

protected:
    void closeEvent(QCloseEvent *event);
private:
    Ui::PropertyPalette *ui;
};

#endif // PROPERTYPALETTE_H
