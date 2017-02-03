
#include "mainwindow.h"
#include "toolpalette.h"
#include "propertypalette.h"
#include "graph.h"

#include <QApplication>


int main(int argc, char *argv[])
{
    QApplication a(argc, argv);

    ToolPalette *tp = new ToolPalette(new QMainWindow());
    tp->show();
    //w->addToolBar(Qt::LeftToolBarArea, tp);

    PropertyPalette *pp = new PropertyPalette;
    pp->show();

    MainWindow *w = new MainWindow();
    w->show();

    return a.exec();
}
