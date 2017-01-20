#include "tikzgraphassembler.h"

TikzGraphAssembler::TikzGraphAssembler(QObject *parent) : QObject(parent)
{

}

void TikzGraphAssembler::addNodeToMap(Node *n) { _nodeMap.insert(n->name(), n); }
Node *TikzGraphAssembler::nodeWithName(QString name) { return _nodeMap[name]; }
