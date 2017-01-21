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
    nodes.removeAll(n);
    inEdges.remove(n);
    outEdges.remove(n);
}

Edge *Graph::addEdge(Node *s, Node *t)
{

}

void Graph::removeEdge(Edge *e)
{

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

Node *Graph::addNode() {
    Node *n = new Node(this);
    nodes << n;
    return n;
}


