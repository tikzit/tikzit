#include "edge.h"

Edge::Edge(Node *s, Node *t, QObject *parent) :
    QObject(parent), _source(s), _target(t)
{
    _data = new GraphElementData();
}

Edge::~Edge()
{
    delete _data;
}

Node *Edge::source() const
{
    return _source;
}

Node *Edge::target() const
{
    return _target;
}

GraphElementData *Edge::data() const
{
    return _data;
}

void Edge::setData(GraphElementData *data)
{
    delete _data;
    _data = data;
}

QString Edge::sourceAnchor() const
{
    return _sourceAnchor;
}

void Edge::setSourceAnchor(const QString &sourceAnchor)
{
    _sourceAnchor = sourceAnchor;
}

QString Edge::targetAnchor() const
{
    return _targetAnchor;
}

void Edge::setTargetAnchor(const QString &targetAnchor)
{
    _targetAnchor = targetAnchor;
}


