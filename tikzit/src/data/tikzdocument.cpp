#include <QFile>
#include <QFileInfo>
#include <QSettings>
#include <QTextStream>
#include <QMessageBox>

#include "tikzdocument.h"
#include "tikzgraphassembler.h"

TikzDocument::TikzDocument(QObject *parent) : QObject(parent)
{
    _graph = new Graph(this);
    _parseSuccess = true;
    _fileName = "";
    _shortName = "";
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
    TikzGraphAssembler ass(newGraph);
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

QString TikzDocument::shortName() const
{
    return _shortName;
}

bool TikzDocument::parseSuccess() const
{
    return _parseSuccess;
}
