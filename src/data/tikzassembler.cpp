#include "tikzassembler.h"

#include "tikzparserdefs.h"
#include "tikzparser.parser.hpp"
#include "tikzlexer.h"

int yyparse(void *scanner);

TikzAssembler::TikzAssembler(Graph *graph, QObject *parent) :
    QObject(parent), _graph(graph), _project(0)
{
    yylex_init(&scanner);
    yyset_extra(this, scanner);
}

TikzAssembler::TikzAssembler(Project *project, QObject *parent) :
    QObject(parent), _graph(0), _project(project)
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

Project *TikzAssembler::project() const
{
    return _project;
}

bool TikzAssembler::isGraph() const
{
    return _graph != 0;
}

bool TikzAssembler::isProject() const
{
    return _project != 0;
}

