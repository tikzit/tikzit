#include "tikzit.h"

#include <QApplication>
#include <QMenuBar>


int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    a.setQuitOnLastWindowClosed(false);
    tikzit = new Tikzit();

    return a.exec();
}
