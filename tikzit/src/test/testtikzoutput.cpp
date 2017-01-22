#include "testtikzoutput.h"
#include "graphelementproperty.h"
#include "graphelementdata.h"

#include <QTest>

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
