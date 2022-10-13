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
    _undoStack = new QUndoStack(this);
    _undoStack->setClean();
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

    // if the file does not exist, only set the file name. The file will be written on
    // the first save.
    if (!file.exists()) {
        refreshTikz();
        _undoStack->resetClean();
        _parseSuccess = true;
        return;
    }

    if (!file.open(QIODevice::ReadOnly)) {
       // QMessageBox::critical(NULL, tr("Error"),
       //         tr("Could not open file"));
        _parseSuccess = false;
        return;
    }

    addToRecentFiles();

    QTextStream in(&file);
    _tikz = in.readAll();
    file.close();

    Graph *oldGraph = _graph;
    Graph *newGraph = new Graph(this);
    TikzAssembler ass(newGraph);
    if (ass.parse(_tikz)) {
        _graph = newGraph;
        oldGraph->deleteLater();
        foreach (Node *n, _graph->nodes()) n->attachStyle();
        foreach (Edge *e, _graph->edges()) {
            e->attachStyle();
            e->updateControls();
        }
        _parseSuccess = true;
        refreshTikz();
        setClean();
    } else {
       // QMessageBox::critical(NULL, tr("Error"),
       //         tr("Could not parse tikz file."));
        newGraph->deleteLater();
        _parseSuccess = false;
    }
}

bool TikzDocument::save() {
    if (_fileName == "") {
        return saveAs();
    } else {
        MainWindow *win = tikzit->activeWindow();
        if (win != nullptr && !win->tikzScene()->enabled()) {
            win->tikzScene()->parseTikz(win->tikzSource());
            if (!win->tikzScene()->enabled()) {
                auto resp = QMessageBox::question(nullptr,
                  tr("Tikz failed to parse"),
                  tr("Cannot save file with invalid TiKZ source. Revert changes and save?"));
                if (resp == QMessageBox::Yes) win->tikzScene()->setEnabled(true);
                else return false; // ABORT the save
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
            addToRecentFiles();
            return true;
        } else {
            QMessageBox::warning(nullptr,
                "Save Failed", "Could not open file: '" + _fileName + "' for writing.");
        }
    }

    return false;
}

bool TikzDocument::isClean() const
{
    return _undoStack->isClean();
}

void TikzDocument::setClean()
{
    _undoStack->setClean();
}

QString TikzDocument::fileName() const
{
    return _fileName;
}

bool TikzDocument::isEmpty()
{
    return _graph->nodes().isEmpty();
}

void TikzDocument::addToRecentFiles()
{
    QSettings settings("tikzit", "tikzit");
    if (!_fileName.isEmpty()) {
        QStringList recentFiles = settings.value("recent-files").toStringList();

        // if the file is in the list already, shift it to the top. Otherwise, add it.
        recentFiles.removeAll(_fileName);
        recentFiles.prepend(_fileName);

        // keep max 10 files
        while (recentFiles.size() > 10) recentFiles.removeLast();

        settings.setValue("recent-files", recentFiles);
        tikzit->updateRecentFiles();
    }
}

void TikzDocument::setGraph(Graph *graph)
{
    _graph = graph;
    refreshTikz();
}

bool TikzDocument::saveAs() {
    MainWindow *win = tikzit->activeWindow();
    if (win != nullptr && !win->tikzScene()->enabled()) {
        win->tikzScene()->parseTikz(win->tikzSource());
        if (!win->tikzScene()->enabled()) {
            auto resp = QMessageBox::question(nullptr,
              tr("Tikz failed to parse"),
              tr("Cannot save file with invalid TiKZ source. Revert changes and save?"));
            if (resp == QMessageBox::Yes) win->tikzScene()->setEnabled(true);
            else return false; // ABORT the save
        }
    }

    QSettings settings("tikzit", "tikzit");

    QFileDialog dialog;
    dialog.setDefaultSuffix("tikz");
    dialog.setWindowTitle(tr("Save File As"));
    dialog.setAcceptMode(QFileDialog::AcceptSave);
    dialog.setNameFilter(tr("TiKZ Files (*.tikz)"));
    dialog.setFileMode(QFileDialog::AnyFile);
    dialog.setDirectory(settings.value("previous-file-path").toString());
    dialog.setOption(QFileDialog::DontUseNativeDialog);

    if (dialog.exec() && !dialog.selectedFiles().isEmpty()) {
        QString fileName = dialog.selectedFiles()[0];
        _fileName = fileName;
        if (save()) {
            // clean state might not change, so update title bar manually
            tikzit->activeWindow()->updateFileName();
            return true;
        }
    }

    return false;
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
