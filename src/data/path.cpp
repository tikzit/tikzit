#include "path.h"

Path::Path(QObject *parent) : QObject(parent)
{

}

int Path::length() const
{
    return _edges.length();
}

void Path::addEdge(Edge *e)
{
    e->setPath(this);
    _edges << e;
}

void Path::removeEdges()
{
    foreach(Edge *e, _edges) {
        e->setPath(nullptr);
    }
    _edges.clear();
}

bool Path::isCycle() const
{
    return !_edges.isEmpty() && _edges.first()->source() == _edges.last()->target();
}

QVector<Edge *> Path::edges() const
{
    return _edges;
}
