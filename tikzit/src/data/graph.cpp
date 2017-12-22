#include "graph.h"

#include <QTextStream>

Graph::Graph(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData(this);
    _bbox = QRectF(0,0,0,0);
}

Graph::~Graph()
{
}

void Graph::removeNode(Node *n) {
    // the node itself is not deleted, as it may still be referenced in an undo command. It will
    // be deleted when graph is, via QObject memory management.
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

QRectF Graph::bbox() const
{
    return _bbox;
}

bool Graph::hasBbox() {
    return !(_bbox == QRectF(0,0,0,0));
}

void Graph::clearBbox() {
    _bbox = QRectF(0,0,0,0);
}

QString Graph::tikz()
{
    QString str;
    QTextStream code(&str);

    code << "\\begin{tikzpicture}" << _data->tikz() << "\n";
    if (hasBbox()) {
        code << "\t\\path [use as bounding box] ("
             << _bbox.topLeft().x() << "," << _bbox.topLeft().y()
             << ") rectangle ("
             << _bbox.bottomRight().x() << "," << _bbox.bottomRight().y()
             << ");\n";
    }

    if (!_nodes.isEmpty())
        code << "\t\\begin{pgfonlayer}{nodelayer}\n";

    Node *n;
    foreach (n, _nodes) {
        code << "\t\t\\node ";

        if (!n->data()->isEmpty())
            code << n->data()->tikz() << " ";

        code << "(" << n->name() << ") at ("
             << n->point().x() << ", " << n->point().y()
             << ") {" << n->label() << "};\n";
    }

    if (!_nodes.isEmpty())
        code << "\t\\end{pgfonlayer}\n";

    if (!_edges.isEmpty())
        code << "\t\\begin{pgfonlayer}{edgelayer}\n";


    Edge *e;
    foreach (e, _edges) {
        code << "\t\t\\draw ";

        if (!e->data()->isEmpty())
            code << e->data()->tikz() << " ";

        code << "(" << e->source()->name();
        if (e->sourceAnchor() != "")
            code << "." << e->sourceAnchor();
        code << ") to ";

        if (e->hasEdgeNode()) {
            code << "node ";
            if (!e->edgeNode()->data()->isEmpty())
                code << e->edgeNode()->data()->tikz() << " ";
            code << "{" << e->edgeNode()->label() << "} ";
        }

        if (e->source() == e->target()) {
            code << "()";
        } else {
            code << "(" << e->target()->name();
            if (e->targetAnchor() != "")
                code << "." << e->targetAnchor();
            code << ")";
        }

        code << ";\n";
    }

    if (!_edges.isEmpty())
        code << "\t\\end{pgfonlayer}\n";

    code << "\\end{tikzpicture}\n";

    code.flush();
    return str;
}

void Graph::setBbox(const QRectF &bbox)
{
    _bbox = bbox;
}

Node *Graph::addNode() {
    Node *n = new Node(this);
    _nodes << n;
    return n;
}


