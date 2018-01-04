#ifndef TESTTEST_H
#define TESTTEST_H

#include <QObject>
#include <QTest>

class TestTest: public QObject
{
    Q_OBJECT
private slots:
    void initTestCase();
    void myFirstTest();
    void mySecondTest();
    void cleanupTestCase();
};

#endif // TESTTEST_H
