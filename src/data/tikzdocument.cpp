#include <QFile>
#include <QFileInfo>
#include <QSettings>
#include <QTextStream>
#include <QMessageBox>
#include <QFileDialog>

#include "tikzit.h"
#include "tikzdocument.h"
#include "tikzassembler.h"
#include "mainwindow.h"

TikzDocument::TikzDocument(QObject *parent) : QObject(parent)
{
    _graph = new Graph(this);
    _parseSuccess = true;
    _fileName = "";
    _shortName = "";
    _undoStack = new QUndoStack();
}

TikzDocument::~TikzDocument()
{
    delete _graph;
    delete _undoStack;
}

QUndoStack *TikzDocument::undoStack() const
{
    return _undoStack;
}

Graph *TikzDocument::graph() const
{
    return _graph;
}

QString TikzDocument::tikz() const
{
    return _tikz;
}

void TikzDocument::open(QString fileName)
{
    _fileName = fileName;
    QFile file(fileName);
    QFileInfo fi(file);
    _shortName = fi.fileName();
    QSettings settings("tikzit", "tikzit");
    settings.setValue("previous-file-path", fi.absolutePath());

    if (!file.open(QIODevice::ReadOnly)) {
//        QMessageBox::critical(this, tr("Error"),
//        tr("Could not open file"));
        _parseSuccess = false;
        return;
    }

    QTextStream in(&file);
    _tikz = in.readAll();
    file.close();

    Graph *newGraph = new Graph(this);
    TikzAssembler ass(newGraph);
    if (ass.parse(_tikz)) {
        delete _graph;
        _graph = newGraph;
        foreach (Node *n, _graph->nodes()) n->attachStyle();
        foreach (Edge *e, _graph->edges()) e->updateControls();
        _parseSuccess = true;
    } else {
        delete newGraph;
        _parseSuccess = false;
    }
}

void TikzDocument::save() {
    if (_fileName == "") {
        saveAs();
    } else {
        refreshTikz();
        QFile file(_fileName);
        QFileInfo fi(file);
        _shortName = fi.fileName();
        QSettings settings("tikzit", "tikzit");
        settings.setValue("previous-file-path", fi.absolutePath());

        if (file.open(QIODevice::WriteOnly)) {
            QTextStream stream(&file);
            stream << _tikz;
            file.close();
            tikzit->activeWindow()->updateFileName();
        } else {
            QMessageBox::warning(0, "Save Failed", "Could not open file: '" + _fileName + "' for writing.");
        }
    }
}

void TikzDocument::setGraph(Graph *graph)
{
    _graph = graph;
    refreshTikz();
}

void TikzDocument::saveAs() {
    QSettings settings("tikzit", "tikzit");
    QString fileName = QFileDialog::getSaveFileName(tikzit->activeWindow(),
                tr("Save File As"),
                settings.value("previous-file-path").toString(),
                tr("TiKZ Files (*.tikz)"));

    if (!fileName.isEmpty()) {
        _fileName = fileName;
        save();
    }
}

QString TikzDocument::shortName() const
{
    return _shortName;
}

bool TikzDocument::parseSuccess() const
{
    return _parseSuccess;
}

void TikzDocument::refreshTikz()
{
    _tikz = _graph->tikz();
    if (MainWindow *w = dynamic_cast<MainWindow*>(parent()))
        w->refreshTikz();
}
