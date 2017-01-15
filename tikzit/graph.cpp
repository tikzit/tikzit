#include "graph.h"

Graph::Graph(QObject *parent) : QObject(parent)
{

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

Node *Graph::addNode() {
    Node *n = new Node(this);
    nodes << n;
    return n;
}


