#ifndef TESTPARSER_H
#define TESTPARSER_H

#include <QObject>

class TestParser : public QObject
{
    Q_OBJECT
private slots:
    //void initTestCase();
    void parseEmptyGraph();
    void parseNodeGraph();
    void parseEdgeGraph();
    //void cleanupTestCase();
};

#endif // TESTPARSER_H
