#include "mainwindow.h"
#include "toolpalette.h"
#include "graph.h"

#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow *w = new MainWindow();
    w->show();

    ToolPalette *tp = new ToolPalette(new QMainWindow());
    tp->show();
    //w->addToolBar(Qt::LeftToolBarArea, tp);

    Graph *g = new Graph;
    Node *n = g->addNode();
    delete g;

    return a.exec();
}
