/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
    _undoStack->setClean();
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
        foreach (Edge *e, _graph->edges()) {
            e->attachStyle();
            e->updateControls();
        }
        _parseSuccess = true;
        refreshTikz();
        setClean();
    } else {
        delete newGraph;
        _parseSuccess = false;
    }
}

void TikzDocument::save() {
    if (_fileName == "") {
        saveAs();
    } else {
        MainWindow *win = tikzit->activeWindow();
        if (win != 0 && !win->tikzScene()->enabled()) {
            win->tikzScene()->parseTikz(win->tikzSource());
            if (!win->tikzScene()->enabled()) {
                auto resp = QMessageBox::question(0,
                  tr("Tikz failed to parse"),
                  tr("Cannot save file with invalid TiKZ source. Revert changes and save?"));
                if (resp == QMessageBox::Yes) win->tikzScene()->setEnabled(true);
                else return; // ABORT the save
            }
        }

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
            setClean();
        } else {
            QMessageBox::warning(0, "Save Failed", "Could not open file: '" + _fileName + "' for writing.");
        }
    }
}

bool TikzDocument::isClean() const
{
    return _undoStack->isClean();
}

void TikzDocument::setClean()
{
    _undoStack->setClean();
}

void TikzDocument::setGraph(Graph *graph)
{
    _graph = graph;
    refreshTikz();
}

void TikzDocument::saveAs() {
    MainWindow *win = tikzit->activeWindow();
    if (win != 0 && !win->tikzScene()->enabled()) {
        win->tikzScene()->parseTikz(win->tikzSource());
        if (!win->tikzScene()->enabled()) {
            auto resp = QMessageBox::question(0,
              tr("Tikz failed to parse"),
              tr("Cannot save file with invalid TiKZ source. Revert changes and save?"));
            if (resp == QMessageBox::Yes) win->tikzScene()->setEnabled(true);
            else return; // ABORT the save
        }
    }

    QSettings settings("tikzit", "tikzit");
    QString fileName = QFileDialog::getSaveFileName(tikzit->activeWindow(),
                tr("Save File As"),
                settings.value("previous-file-path").toString(),
                tr("TiKZ Files (*.tikz)"));

    if (!fileName.isEmpty()) {
        _fileName = fileName;
        save();

        // clean state might not change, so update title bar manually
        tikzit->activeWindow()->updateFileName();
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
