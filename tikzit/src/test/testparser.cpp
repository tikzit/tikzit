#include "testparser.h"
#include "graph.h"
#include "tikzgraphassembler.h"

#include <QTest>
#include <QVector>

//void TestParser::initTestCase()
//{

//}

//void TestParser::cleanupTestCase()
//{

//}

void TestParser::parseEmptyGraph()
{
    Graph *g = new Graph();
    TikzGraphAssembler ga(g);
    bool res = ga.parse("\\begin{tikzpicture}\n\\end{tikzpicture}");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 0);
    QVERIFY(g->edges().size() == 0);
    delete g;
}

void TestParser::parseNodeGraph()
{
    Graph *g = new Graph();
    TikzGraphAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\node (node0) at (1.1, -2.2) {};\n"
    "  \\node (node1) at (3, 4) {test};\n"
    "\\end{tikzpicture}");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 2);
    QVERIFY(g->edges().size() == 0);
    QVERIFY(g->nodes()[0]->name() == "node0");
    QVERIFY(g->nodes()[0]->label() == "");
    QVERIFY(g->nodes()[0]->point() == QPointF(1.1,-2.2));
    QVERIFY(g->nodes()[1]->name() == "node1");
    QVERIFY(g->nodes()[1]->label() == "test");
    QVERIFY(g->nodes()[1]->point() == QPointF(3,4));
    delete g;
}

void TestParser::parseEdgeGraph()
{
    Graph *g = new Graph();
    TikzGraphAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\begin{pgfonlayer}{nodelayer}\n"
    "    \\node [style=none] (0) at (-1, -1) {};\n"
    "    \\node [style=none] (1) at (0, 1) {};\n"
    "    \\node [style=none] (2) at (1, -1) {};\n"
    "  \\end{pgfonlayer}\n"
    "  \\begin{pgfonlayer}{edgelayer}\n"
    "    \\draw [style=diredge] (1.center) to (2.center);\n"
    "    \\draw [style=diredge] (2.center) to (0.center);\n"
    "    \\draw [style=diredge] (0.center) to (1.center);\n"
    "  \\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 3);
    QVERIFY(g->edges().size() == 3);
    delete g;
}


