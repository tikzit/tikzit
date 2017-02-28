#include "mainwindow.h"
#include "ui_mainwindow.h"
#include "tikzgraphassembler.h"
#include "toolpalette.h"
#include "tikzit.h"

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
    _windowId = _numWindows;
    _numWindows++;
    ui->setupUi(this);
    setAttribute(Qt::WA_DeleteOnClose, true);
    _graph = new Graph(this);
    _tikzScene = new TikzScene(_graph, this);
    ui->tikzView->setScene(_tikzScene);
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
    tikzit->removeWindow(this);
}

void MainWindow::open(QString fileName)
{
    _fileName = fileName;
    _pristine = false;
    QFile file(fileName);
    QFileInfo fi(file);
    QSettings settings("tikzit", "tikzit");
    settings.setValue("previous-file-path", fi.absolutePath());

    setWindowTitle("TiKZiT - " + fi.fileName());

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
        delete _graph;
        _graph = newGraph;
        foreach (Node *n, _graph->nodes()) n->attachStyle();
        foreach (Edge *e, _graph->edges()) e->updateControls();
        _tikzScene->setGraph(_graph);
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

void MainWindow::changeEvent(QEvent *event)
{
    if (event->type() == QEvent::ActivationChange && isActiveWindow()) {
        tikzit->setActiveWindow(this);
    }
    QMainWindow::changeEvent(event);
}

TikzScene *MainWindow::tikzScene() const
{
    return _tikzScene;
}

int MainWindow::windowId() const
{
    return _windowId;
}

TikzView *MainWindow::tikzView() const
{
    return ui->tikzView;
}

bool MainWindow::pristine() const
{
    return _pristine;
}


