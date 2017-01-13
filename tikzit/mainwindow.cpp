#include "mainwindow.h"

#include <QDebug>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent)
{
    setAttribute(Qt::WA_DeleteOnClose);
    tikzScene = new TikzScene(this);
    tikzView = new QGraphicsView(tikzScene);
    setCentralWidget(tikzView);
    resize(700, 500);
}

MainWindow::~MainWindow()
{
    qDebug() << "~MainWindow";
}
