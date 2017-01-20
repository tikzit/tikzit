#include "edge.h"

Edge::Edge(Node *s, Node *t, QObject *parent) :
    QObject(parent), _source(s), _target(t)
{

}

Node *Edge::source() const
{
    return _source;
}

Node *Edge::target() const
{
    return _target;
}


