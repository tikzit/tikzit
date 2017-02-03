#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "tikzgraphassembler.h"

#include <QDebug>
#include <QFile>
#include <QList>
#include <QSettings>
#include <QMessageBox>
#include <QFileDialog>

int MainWindow::_numWindows = 0;

MainWindow::MainWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainWindow)
{
    _numWindows++;
    ui->setupUi(this);
    setAttribute(Qt::WA_DeleteOnClose);
    _graph = new Graph(this);
    tikzScene = new TikzScene(_graph, this);
    ui->tikzView->setScene(tikzScene);
    _fileName = "";
    _pristine = true;

    // initially, the source view should be collapsed
    QList<int> sz = ui->splitter->sizes();
    sz[0] = sz[0] + sz[1];
    sz[1] = 0;
    ui->splitter->setSizes(sz);
}

MainWindow::~MainWindow()
{
    //qDebug() << "~MainWindow";
}

void MainWindow::open(QString fileName)
{
    _fileName = fileName;
    _pristine = false;
    QFile file(fileName);
    QFileInfo fi(file);
    QSettings settings("tikzit", "tikzit");
    settings.setValue("previous-file-path", fi.absolutePath());

    if (!file.open(QIODevice::ReadOnly)) {
        QMessageBox::critical(this, tr("Error"),
        tr("Could not open file"));
        return;
    }

    QTextStream in(&file);
    QString tikz = in.readAll();
    file.close();

    ui->tikzSource->setText(tikz);

    Graph *newGraph = new Graph(this);
    TikzGraphAssembler ass(newGraph);
    if (ass.parse(tikz)) {
        statusBar()->showMessage("TiKZ parsed successfully", 2000);
        tikzScene->setGraph(newGraph);
        delete _graph;
        _graph = newGraph;
    } else {
        statusBar()->showMessage("Cannot read TiKZ source");
        delete newGraph;
    }

}

void MainWindow::closeEvent(QCloseEvent *event)
{
    //qDebug() << "got close event";
    QMainWindow::closeEvent(event);
}

void MainWindow::on_actionOpen_triggered()
{
    QSettings settings("tikzit", "tikzit");
    QString fileName = QFileDialog::getOpenFileName(
                this,
                tr("Open File"),
                settings.value("previous-file-path").toString(),
                tr("TiKZ Files (*.tikz)"));

    if (!fileName.isEmpty()) {
        if (_pristine) {
            open(fileName);
        } else {
            MainWindow *w = new MainWindow();
            w->show();
            w->open(fileName);
        }
    }
}


