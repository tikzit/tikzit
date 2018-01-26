#include "testtikzoutput.h"
#include "graphelementproperty.h"
#include "graphelementdata.h"
#include "graph.h"
#include "tikzassembler.h"

#include <QTest>
#include <QRectF>
#include <QPointF>

void TestTikzOutput::escape()
{
    QVERIFY(GraphElementProperty::tikzEscape("foo") == "foo");
    QVERIFY(GraphElementProperty::tikzEscape("foo'") == "foo'");
    QVERIFY(GraphElementProperty::tikzEscape("foo bar") == "foo bar");
    QVERIFY(GraphElementProperty::tikzEscape("foo.bar") == "foo.bar");
    QVERIFY(GraphElementProperty::tikzEscape("foo-bar") == "foo-bar");
    QVERIFY(GraphElementProperty::tikzEscape("foo >") == "foo >");
    QVERIFY(GraphElementProperty::tikzEscape("foo <") == "foo <");
    QVERIFY(GraphElementProperty::tikzEscape("foo+") == "{foo+}");
    QVERIFY(GraphElementProperty::tikzEscape("foo{bar}") == "{foo{bar}}");
}

void TestTikzOutput::data()
{
    GraphElementData d;
    QVERIFY(d.tikz() == "");
    d.setAtom("foo");
    QVERIFY(d.tikz() == "[foo]");
    d.setAtom("bar");
    QVERIFY(d.tikz() == "[foo, bar]");
    d.setProperty("foo","bar");
    QVERIFY(d.tikz() == "[foo, bar, foo=bar]");
    d.setAtom("foo+");
    QVERIFY(d.tikz() == "[foo, bar, foo=bar, {foo+}]");
    d.unsetAtom("foo");
    QVERIFY(d.tikz() == "[bar, foo=bar, {foo+}]");
    d.unsetProperty("foo");
    QVERIFY(d.tikz() == "[bar, {foo+}]");
    d.unsetAtom("foo+");
    QVERIFY(d.tikz() == "[bar]");
    d.unsetAtom("bar");
    QVERIFY(d.tikz() == "");
}

void TestTikzOutput::graphEmpty()
{
    Graph *g = new Graph();

    QString tikz =
    "\\begin{tikzpicture}\n"
    "\\end{tikzpicture}\n";
    QVERIFY(g->tikz() == tikz);

    delete g;
}

void TestTikzOutput::graphFromTikz()
{
    Graph *g = new Graph();
    TikzAssembler ga(g);

    QString tikz =
    "\\begin{tikzpicture}\n"
    "\t\\path [use as bounding box] (-1.5,-1.5) rectangle (1.5,1.5);\n"
    "\t\\begin{pgfonlayer}{nodelayer}\n"
    "\t\t\\node [style=white dot] (0) at (-1, -1) {};\n"
    "\t\t\\node [style=white dot] (1) at (0, 1) {};\n"
    "\t\t\\node [style=white dot] (2) at (1, -1) {};\n"
    "\t\\end{pgfonlayer}\n"
    "\t\\begin{pgfonlayer}{edgelayer}\n"
    "\t\t\\draw [style=diredge] (1) to (2);\n"
    "\t\t\\draw [style=diredge] (2.center) to (0);\n"
    "\t\t\\draw [style=diredge] (0) to ();\n"
    "\t\\end{pgfonlayer}\n"
    "\\end{tikzpicture}\n";
    bool res = ga.parse(tikz);
    QVERIFY2(res, "parsed successfully");
    QVERIFY2(g->tikz() == tikz, "produced matching tikz");

    delete g;
}

void TestTikzOutput::graphBbox()
{
    Graph *g = new Graph();
    g->setBbox(QRectF(QPointF(-0.75, -0.5), QPointF(0.25, 1)));

    QString tikz =
    "\\begin{tikzpicture}\n"
    "\t\\path [use as bounding box] (-0.75,-0.5) rectangle (0.25,1);\n"
    "\\end{tikzpicture}\n";
    QVERIFY(g->tikz() == tikz);


    delete g;
}
