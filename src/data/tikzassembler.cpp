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

#include "tikzassembler.h"

#include "tikzparserdefs.h"
#include "tikzparser.parser.hpp"
#include "tikzlexer.h"

int yyparse(void *scanner);

TikzAssembler::TikzAssembler(Graph *graph, QObject *parent) :
    QObject(parent), _graph(graph), _tikzStyles(0)
{
    yylex_init(&scanner);
    yyset_extra(this, scanner);
    _currentEdgeData = nullptr;
}

TikzAssembler::TikzAssembler(TikzStyles *tikzStyles, QObject *parent) :
    QObject(parent), _graph(0), _tikzStyles(tikzStyles)
{
    yylex_init(&scanner);
    yyset_extra(this, scanner);
    _currentEdgeData = nullptr;
}

void TikzAssembler::addNodeToMap(Node *n) { _nodeMap.insert(n->name(), n); }
Node *TikzAssembler::nodeWithName(QString name) { return _nodeMap[name]; }

bool TikzAssembler::parse(const QString &tikz)
{
    yy_scan_string(tikz.toLatin1().data(), scanner);
    int result = yyparse(scanner);

    if (result == 0) return true;
    else return false;
}

Graph *TikzAssembler::graph() const
{
    return _graph;
}

TikzStyles *TikzAssembler::tikzStyles() const
{
    return _tikzStyles;
}

bool TikzAssembler::isGraph() const
{
    return _graph != 0;
}

bool TikzAssembler::isTikzStyles() const
{
    return _tikzStyles != 0;
}

Node *TikzAssembler::currentEdgeSource() const
{
    return _currentEdgeSource;
}

void TikzAssembler::setCurrentEdgeSource(Node *currentEdgeSource)
{
    _currentEdgeSource = currentEdgeSource;
}

GraphElementData *TikzAssembler::currentEdgeData() const
{
    return _currentEdgeData;
}

void TikzAssembler::setCurrentEdgeData(GraphElementData *currentEdgeData)
{
    _currentEdgeData = currentEdgeData;
}

QString TikzAssembler::currentEdgeSourceAnchor() const
{
    return _currentEdgeSourceAnchor;
}

void TikzAssembler::setCurrentEdgeSourceAnchor(const QString &currentEdgeSourceAnchor)
{
    _currentEdgeSourceAnchor = currentEdgeSourceAnchor;
}

void TikzAssembler::finishCurrentPath()
{
    if (_currentEdgeData) {
        delete _currentEdgeData;
        _currentEdgeData = nullptr;
    }
    // TODO: create a path and add it to graph
}

