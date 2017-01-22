#ifndef GRAPH_H
#define GRAPH_H

#include "node.h"
#include "edge.h"
#include "graphelementdata.h"

#include <QObject>
#include <QVector>
#include <QMultiHash>

class Graph : public QObject
{
    Q_OBJECT
public:
    explicit Graph(QObject *parent = 0);
    ~Graph();
    Node *addNode();
    void removeNode(Node *n);
    Edge *addEdge(Node *s, Node*t);
    void removeEdge(Edge *e);

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    const QVector<Node *> &nodes();
    const QVector<Edge*> &edges();

signals:

public slots:

private:
    QVector<Node*> _nodes;
    QVector<Edge*> _edges;
    QMultiHash<Node*,Edge*> inEdges;
    QMultiHash<Node*,Edge*> outEdges;
    GraphElementData *_data;
};

#endif // GRAPH_H
