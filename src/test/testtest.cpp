#include "testtest.h"

#include <QObject>
#include <QTest>

void TestTest::initTestCase() { qDebug("initialising test"); }
void TestTest::myFirstTest() { QVERIFY(1 == 1); }
void TestTest::mySecondTest() { QVERIFY(1 != 2); }
void TestTest::cleanupTestCase() { qDebug("cleaning up test"); }

