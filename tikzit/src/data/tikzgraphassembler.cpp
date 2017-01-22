#include "tikzgraphassembler.h"

#include "tikzparserdefs.h"
#include "tikzparser.parser.hpp"
#include "tikzlexer.h"

int yyparse(void *scanner);


TikzGraphAssembler::TikzGraphAssembler(Graph *graph, QObject *parent) :
    QObject(parent), _graph(graph)
{
    yylex_init(&scanner);
    yyset_extra(this, scanner);
}

void TikzGraphAssembler::addNodeToMap(Node *n) { _nodeMap.insert(n->name(), n); }
Node *TikzGraphAssembler::nodeWithName(QString name) { return _nodeMap[name]; }

bool TikzGraphAssembler::parse(const QString &tikz)
{
    yy_scan_string(tikz.toLatin1().data(), scanner);
    int result = yyparse(scanner);

    if (result == 0) return true;
    else return false;
}

Graph *TikzGraphAssembler::graph() const
{
    return _graph;
}

