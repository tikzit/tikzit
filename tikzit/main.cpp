#include "mainwindow.h"
#include "toolpalette.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow *w = new MainWindow();
    w->show();

    ToolPalette *tp = new ToolPalette();
    tp->show();

    return a.exec();
}
