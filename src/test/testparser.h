#ifndef TESTPARSER_H
#define TESTPARSER_H

#include <QObject>

class TestParser : public QObject
{
    Q_OBJECT
private slots:
    void parseEmptyGraph();
    void parseNodeGraph();
    void parseEdgeGraph();
    void parseEdgeNode();
    void parseEdgeBends();
    void parseBbox();
};

#endif // TESTPARSER_H
