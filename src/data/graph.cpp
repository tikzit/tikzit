#include "graph.h"

#include <QTextStream>
#include <QSet>
#include <QtAlgorithms>
#include <QDebug>
#include <algorithm>

Graph::Graph(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData(this);
    _bbox = QRectF(0,0,0,0);
}

Graph::~Graph()
{
}

// add a node. The graph claims ownership.
void Graph::addNode(Node *n) {
    n->setParent(this);
    _nodes << n;
}

void Graph::addNode(Node *n, int index)
{
    n->setParent(this);
    _nodes.insert(index, n);
}

void Graph::removeNode(Node *n) {
    // the node itself is not deleted, as it may still be referenced in an undo command. It will
    // be deleted when graph is, via QObject memory management.
    _nodes.removeOne(n);
}


void Graph::addEdge(Edge *e)
{
    e->setParent(this);
    _edges << e;
}

void Graph::addEdge(Edge *e, int index)
{
    e->setParent(this);
    _edges.insert(index, e);
}

void Graph::removeEdge(Edge *e)
{
    // the edge itself is not deleted, as it may still be referenced in an undo command. It will
    // be deleted when graph is, via QObject memory management.
    _edges.removeOne(e);
}

int Graph::maxIntName()
{
    int max = -1;
    int i;
    bool ok;
    foreach (Node *n, _nodes) {
        i = n->name().toInt(&ok);
        if (ok && i > max) max = i;
    }
    return max;
}

QString Graph::freshNodeName()
{
    return QString::number(maxIntName() + 1);
}

void Graph::renameApart(Graph *graph)
{
    int i = graph->maxIntName() + 1;
    foreach (Node *n, _nodes) {
        n->setName(QString::number(i));
        i++;
    }
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
    int line = 0;

    code << "\\begin{tikzpicture}" << _data->tikz() << "\n";
    line++;
    if (hasBbox()) {
        code << "\t\\path [use as bounding box] ("
             << _bbox.topLeft().x() << "," << _bbox.topLeft().y()
             << ") rectangle ("
             << _bbox.bottomRight().x() << "," << _bbox.bottomRight().y()
             << ");\n";
        line++;
    }

    if (!_nodes.isEmpty()) {
        code << "\t\\begin{pgfonlayer}{nodelayer}\n";
        line++;
    }

    Node *n;
    foreach (n, _nodes) {
        n->setTikzLine(line);
        code << "\t\t\\node ";

        if (!n->data()->isEmpty())
            code << n->data()->tikz() << " ";

        code << "(" << n->name() << ") at ("
             << n->point().x() << ", " << n->point().y()
             << ") {" << n->label() << "};\n";
        line++;
    }

    if (!_nodes.isEmpty()) {
        code << "\t\\end{pgfonlayer}\n";
        line++;
    }

    if (!_edges.isEmpty()) {
        code << "\t\\begin{pgfonlayer}{edgelayer}\n";
        line++;
    }


    Edge *e;
    foreach (e, _edges) {
        e->updateData();
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
        line++;
    }

    if (!_edges.isEmpty()) {
        code << "\t\\end{pgfonlayer}\n";
        line++;
    }

    code << "\\end{tikzpicture}\n";
    line++;

    code.flush();
    return str;
}

Graph *Graph::copyOfSubgraphWithNodes(QSet<Node *> nds)
{
    Graph *g = new Graph();
    g->setData(_data->copy());
    QMap<Node*,Node*> nodeTable;
    foreach (Node *n, nds) {
        Node *n1 = n->copy();
        nodeTable.insert(n, n1);
        g->addNode(n1);
    }
    foreach (Edge *e, edges()) {
        if (nds.contains(e->source()) || nds.contains(e->target())) {
            g->addEdge(e->copy(&nodeTable));
        }
    }

    return g;
}

void Graph::insertGraph(Graph *graph)
{
    QMap<Node*,Node*> nodeTable;
    foreach (Node *n, graph->nodes()) {
        Node *n1 = n->copy();
        nodeTable.insert(n, n1);
        addNode(n1);
    }
    foreach (Edge *e, graph->edges()) {
        addEdge(e->copy(&nodeTable));
    }
}

void Graph::setBbox(const QRectF &bbox)
{
    _bbox = bbox;
}


