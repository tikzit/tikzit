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

/*!
  * This class contains a tikz Graph, source code, file info, and undo stack.  It serves as the model
  * in the MVC triple (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZDOCUMENT_H
#define TIKZDOCUMENT_H

#include "graph.h"

#include <QObject>
#include <QUndoStack>

class TikzDocument : public QObject
{
    Q_OBJECT
public:
    explicit TikzDocument(QObject *parent = 0);

    Graph *graph() const;
    void setGraph(Graph *graph);
    QString tikz() const;
    QUndoStack *undoStack() const;
    bool parseSuccess() const;
    void refreshTikz();

    void open(QString fileName);

    QString shortName() const;

    bool saveAs();
    bool save();

    bool isClean() const;
    void setClean();

    QString fileName() const;

    bool isEmpty();

private:
    Graph *_graph;
    QString _tikz;
    QString _fileName;
    QString _shortName;
    QUndoStack *_undoStack;
    bool _parseSuccess;
    void addToRecentFiles();

signals:

public slots:
};

#endif // TIKZDOCUMENT_H
