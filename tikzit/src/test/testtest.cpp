#include <QObject>
#include <QTest>

class TestTest: public QObject
{
    Q_OBJECT
private slots:
    void initTestCase()
    { qDebug("initialising test"); }
    void myFirstTest()
    { QVERIFY(1 == 1); }
    void mySecondTest()
    { QVERIFY(1 != 2); }
    void cleanupTestCase()
    { qDebug("cleaning up test"); }
};

