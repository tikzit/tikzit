#include "tikzgraphassembler.h"

TikzGraphAssembler::TikzGraphAssembler(Graph *graph, QObject *parent) :
    _graph(graph), QObject(parent)
{

}

void TikzGraphAssembler::addNodeToMap(Node *n) { _nodeMap.insert(n->name(), n); }
Node *TikzGraphAssembler::nodeWithName(QString name) { return _nodeMap[name]; }

Graph *TikzGraphAssembler::graph() const
{
    return _graph;
}

