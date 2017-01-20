#include "mainwindow.h"
#include "ui_mainwindow.h"

#include <QDebug>

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    setAttribute(Qt::WA_DeleteOnClose);
    tikzScene = new TikzScene(this);
    ui->tikzView->setScene(tikzScene);
    //tikzView = new QGraphicsView(tikzScene);
    //setCentralWidget(tikzView);
    //resize(700, 500);
    // badger?
}

MainWindow::~MainWindow()
{
    qDebug() << "~MainWindow";
}
