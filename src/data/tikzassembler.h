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
  * Convenience class to hold the parser state while loading tikz graphs or projects.
  */

#ifndef TIKZASSEMBLER_H
#define TIKZASSEMBLER_H

#include "node.h"
#include "graph.h"
#include "tikzstyles.h"

#include <QObject>
#include <QHash>

class TikzAssembler : public QObject
{
    Q_OBJECT
public:
    explicit TikzAssembler(Graph *graph, QObject *parent = 0);
    explicit TikzAssembler(TikzStyles *tikzStyles, QObject *parent = 0);
    void addNodeToMap(Node *n);
    Node *nodeWithName(QString name);
    bool parse(const QString &tikz);

    Graph *graph() const;
    TikzStyles *tikzStyles() const;
    bool isGraph() const;
    bool isTikzStyles() const;


    Node *currentEdgeSource() const;
    void setCurrentEdgeSource(Node *currentEdgeSource);

    GraphElementData *currentEdgeData() const;
    void setCurrentEdgeData(GraphElementData *currentEdgeData);

    QString currentEdgeSourceAnchor() const;
    void setCurrentEdgeSourceAnchor(const QString &currentEdgeSourceAnchor);

    void finishCurrentPath();

signals:

public slots:

private:
    QHash<QString,Node*> _nodeMap;
    Graph *_graph;
    TikzStyles *_tikzStyles;
    Node *_currentEdgeSource;
    GraphElementData *_currentEdgeData;
    QString _currentEdgeSourceAnchor;
    void *scanner;
};

#endif // TIKZASSEMBLER_H
