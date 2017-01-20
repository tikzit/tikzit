#ifndef GRAPH_H
#define GRAPH_H

#include "node.h"
#include "edge.h"

#include <QObject>
#include <QVector>
#include <QMultiHash>

class Graph : public QObject
{
    Q_OBJECT
public:
    explicit Graph(QObject *parent = 0);
    Node *addNode();
    void removeNode(Node *n);
    Edge *addEdge(Node *s, Node*t);
    void removeEdge(Edge *e);

signals:

public slots:

private:
    QVector<Node*> nodes;
    QVector<Edge*> edges;
    QMultiHash<Node*,Edge*> inEdges;
    QMultiHash<Node*,Edge*> outEdges;
};

#endif // GRAPH_H
