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
}

TikzAssembler::TikzAssembler(TikzStyles *tikzStyles, QObject *parent) :
    QObject(parent), _graph(0), _tikzStyles(tikzStyles)
{
    yylex_init(&scanner);
    yyset_extra(this, scanner);
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

