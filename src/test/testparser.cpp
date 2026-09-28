#include <QFile>
#include <QFileInfo>
#include <QTextStream>
#include <QDir>
#include "testparser.h"
#include "graph.h"
#include "tikzassembler.h"

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
    TikzAssembler ga(g);
    bool res = ga.parse("\\begin{tikzpicture}\n\\end{tikzpicture}");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 0);
    QVERIFY(g->edges().size() == 0);
    delete g;
}

void TestParser::parseNodeGraph()
{
    Graph *g = new Graph();
    TikzAssembler ga(g);
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
    TikzAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\begin{pgfonlayer}{nodelayer}\n"
    "    \\node [style=x, {foo++}] (0) at (-1, -1) {};\n"
    "    \\node [style=y] (1) at (0, 1) {};\n"
    "    \\node [style=z] (2) at (1, -1) {};\n"
    "  \\end{pgfonlayer}\n"
    "  \\begin{pgfonlayer}{edgelayer}\n"
    "    \\draw [style=a] (1.center) to (2);\n"
    "    \\draw [style=b, foo] (2) to (0.west);\n"
    "    \\draw [style=c] (0) to (1);\n"
    "  \\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 3);
    QVERIFY(g->edges().size() == 3);
    QVERIFY(g->nodes()[0]->data()->atom("foo++"));
    QVERIFY(g->edges()[0]->data()->property("style") == "a");
    QVERIFY(!g->edges()[0]->data()->atom("foo"));
    QVERIFY(g->edges()[1]->data()->property("style") == "b");
    QVERIFY(g->edges()[1]->data()->atom("foo"));
    QVERIFY(g->edges()[2]->data()->property("style") == "c");
    Node *en = g->edges()[0]->edgeNode();
    QVERIFY(en == 0);
    delete g;
}

void TestParser::parseEdgeNode()
{
    Graph *g = new Graph();
    TikzAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\begin{pgfonlayer}{nodelayer}\n"
    "    \\node [style=none] (0) at (-1, 0) {};\n"
    "    \\node [style=none] (1) at (1, 0) {};\n"
    "  \\end{pgfonlayer}\n"
    "  \\begin{pgfonlayer}{edgelayer}\n"
    "    \\draw [style=diredge] (0.center) to node[foo, bar=baz baz]{test} (1.center);\n"
    "  \\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 2);
    QVERIFY(g->edges().size() == 1);
    Node *en = g->edges()[0]->edgeNode();
    QVERIFY(en != 0);
    QVERIFY(en->label() == "test");
    QVERIFY(en->data()->atom("foo"));
    QVERIFY(en->data()->property("bar") == "baz baz");
    delete g;
}

void TestParser::parseEdgeBends()
{
    Graph *g = new Graph();
    TikzAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\begin{pgfonlayer}{nodelayer}\n"
    "    \\node [style=white] (0) at (-1, 0) {};\n"
    "    \\node [style=black] (1) at (1, 0) {};\n"
    "  \\end{pgfonlayer}\n"
    "  \\begin{pgfonlayer}{edgelayer}\n"
    "    \\draw [style=diredge,bend left] (0) to (1);\n"
    "    \\draw [style=diredge,bend right] (0) to (1);\n"
    "    \\draw [style=diredge,bend left=20] (0) to (1);\n"
    "    \\draw [style=diredge,bend right=80] (0) to (1);\n"
    "    \\draw [style=diredge,in=10,out=150,looseness=2] (0) to (1);\n"
    "  \\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 2);
    QVERIFY(g->edges().size() == 5);
    QVERIFY(g->edges()[0]->bend() == -30);
    QVERIFY(g->edges()[1]->bend() == 30);
    QVERIFY(g->edges()[2]->bend() == -20);
    QVERIFY(g->edges()[3]->bend() == 80);
    QVERIFY(g->edges()[4]->inAngle() == 10);
    QVERIFY(g->edges()[4]->outAngle() == 150);
    QVERIFY(qFuzzyCompare(g->edges()[4]->weight(), 2.0/2.5));
}

void TestParser::parseBbox()
{
    Graph *g = new Graph();
    TikzAssembler ga(g);
    bool res = ga.parse(
    "\\begin{tikzpicture}\n"
    "  \\path [use as bounding box] (-1.5,-1.5) rectangle (1.5,1.5);\n"
    "  \\begin{pgfonlayer}{nodelayer}\n"
    "    \\node [style=white dot] (0) at (-1, -1) {};\n"
    "    \\node [style=white dot] (1) at (0, 1) {};\n"
    "    \\node [style=white dot] (2) at (1, -1) {};\n"
    "  \\end{pgfonlayer}\n"
    "  \\begin{pgfonlayer}{edgelayer}\n"
    "    \\draw [style=diredge] (1) to (2);\n"
    "    \\draw [style=diredge] (2) to (0);\n"
    "    \\draw [style=diredge] (0) to (1);\n"
    "  \\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n");
    QVERIFY(res);
    QVERIFY(g->nodes().size() == 3);
    QVERIFY(g->edges().size() == 3);
    QVERIFY(g->hasBbox());
    QVERIFY(g->bbox() == QRectF(QPointF(-1.5,-1.5), QPointF(1.5,1.5)));

    delete g;
}



void TestParser::parseCorpusDiagrams()
{
    struct ExpectedCounts {
        int nodes;
        int edges;
    };

    QMap<QString, ExpectedCounts> expected = {
        {"01_spider_fusion.tikz", {6, 6}},
        {"02_identity_spiders.tikz", {6, 3}},
        {"03_yanking_cup_cap.tikz", {6, 4}},
        {"04_cup_cap_duality.tikz", {6, 2}},
        {"05_bialgebra_law.tikz", {6, 5}},
        {"06_hadamard_color_change.tikz", {5, 4}},
        {"07_cnot_gate.tikz", {6, 5}},
        {"08_cz_gate.tikz", {7, 6}},
        {"09_swap_gate.tikz", {4, 2}},
        {"10_teleportation.tikz", {8, 9}},
        {"11_ghz_state.tikz", {4, 3}},
        {"12_entanglement_swapping.tikz", {6, 5}}
    };

    // Locate docs/examples/zx-calculus relative to app dir or source dir
    QStringList candidates = {
        "../docs/examples/zx-calculus",
        "../../docs/examples/zx-calculus",
        "docs/examples/zx-calculus",
        "/Users/bkoo/Documents/Development/PicturingProcesses/tikzit/docs/examples/zx-calculus"
    };

    QString zxDir;
    for (const QString &c : candidates) {
        if (QDir(c).exists()) {
            zxDir = c;
            break;
        }
    }

    QVERIFY2(!zxDir.isEmpty(), "Found zx-calculus corpus directory");

    for (auto it = expected.begin(); it != expected.end(); ++it) {
        QString filePath = zxDir + "/" + it.key();
        QFile file(filePath);
        QVERIFY2(file.open(QIODevice::ReadOnly | QIODevice::Text),
                 QString("Open %1").arg(filePath).toUtf8().constData());

        QTextStream in(&file);
        QString tikzContent = in.readAll();
        file.close();

        Graph *g = new Graph();
        TikzAssembler ga(g);
        bool parsed = ga.parse(tikzContent);
        QVERIFY2(parsed, QString("Parse %1").arg(it.key()).toUtf8().constData());
        QCOMPARE(g->nodes().size(), it.value().nodes);
        QCOMPARE(g->edges().size(), it.value().edges);

        delete g;
    }
}
