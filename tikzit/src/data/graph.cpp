#include "graph.h"

Graph::Graph(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData();
}

Graph::~Graph()
{
    delete _data;
}

void Graph::removeNode(Node *n) {
    _nodes.removeAll(n);
    inEdges.remove(n);
    outEdges.remove(n);
}

Edge *Graph::addEdge(Node *s, Node *t)
{
    Edge *e = new Edge(s, t, this);
    _edges << e;
    outEdges.insert(s, e);
    inEdges.insert(t, e);
    return e;
}

void Graph::removeEdge(Edge *e)
{
    _edges.removeAll(e);
    outEdges.remove(e->source(), e);
    inEdges.remove(e->target(), e);
}

GraphElementData *Graph::data() const
{
    return _data;
}

void Graph::setData(GraphElementData *data)
{
    delete _data;
    _data = data;
}

const QVector<Node*> &Graph::nodes()
{
    return _nodes;
}

const QVector<Edge*> &Graph::edges()
{
    return _edges;
}

Node *Graph::addNode() {
    Node *n = new Node(this);
    _nodes << n;
    return n;
}


