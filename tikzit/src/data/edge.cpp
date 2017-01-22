#include "edge.h"

#include <QDebug>

Edge::Edge(Node *s, Node *t, QObject *parent) :
    QObject(parent), _source(s), _target(t)
{
    _data = new GraphElementData();
    _edgeNode = 0;
}

Edge::~Edge()
{
    delete _data;
    delete _edgeNode;
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

Node *Edge::edgeNode() const
{
    return _edgeNode;
}

void Edge::setEdgeNode(Node *edgeNode)
{
    if (_edgeNode != 0) delete _edgeNode;
    _edgeNode = edgeNode;
}


