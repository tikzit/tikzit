/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

#include "graph.h"
#include "util.h"

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

QRectF Graph::realBbox()
{
    //float maxX = 0.0f;
    QRectF rect = bbox();
    foreach (Node *n, _nodes) {
        rect = rect.united(QRectF(n->point().x()-0.5f,
                                  n->point().y()-0.5f,
                                  1.0f, 1.0f));
    }

    return rect;
}

QRectF Graph::boundsForNodes(QSet<Node*>nds) {
	QPointF p;
	QPointF tl;
	QPointF br;
	bool hasPoints = false;
	foreach (Node *n, nds) {
		p = n->point();
		if (!hasPoints) {
			hasPoints = true;
			tl = p;
			br = p;
		} else {
			if (p.x() < tl.x()) tl.setX(p.x());
			if (p.y() > tl.y()) tl.setY(p.y());
			if (p.x() > br.x()) br.setX(p.x());
			if (p.y() < br.y()) br.setY(p.y());
		}
	}

	QRectF rect(tl, br);
	return rect;
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
             << floatToString(n->point().x())
             << ", "
             << floatToString(n->point().y())
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
        e->setTikzLine(line);
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
    foreach (Node *n, nodes()) {
        if (nds.contains(n)) {
            Node *n1 = n->copy();
            nodeTable.insert(n, n1);
            g->addNode(n1);
        }
    }
    foreach (Edge *e, edges()) {
        if (nds.contains(e->source()) && nds.contains(e->target())) {
            g->addEdge(e->copy(&nodeTable));
        }
    }

    return g;
}

void Graph::insertGraph(Graph *graph)
{
    QMap<Node*,Node*> nodeTable;
    foreach (Node *n, graph->nodes()) addNode(n);
    foreach (Edge *e, graph->edges()) addEdge(e);
}

void Graph::reflectNodes(QSet<Node*> nds, bool horizontal)
{
    QRectF bds = boundsForNodes(nds);
    float ctr;
    if (horizontal) ctr = bds.center().x();
    else ctr = bds.center().y();

    QPointF p;
    foreach(Node *n, nds) {
        p = n->point();
        if (horizontal) p.setX(2 * ctr - p.x());
        else p.setY(2 * ctr - p.y());
        n->setPoint(p);
    }

    foreach (Edge *e, _edges) {
        if (nds.contains(e->source()) && nds.contains(e->target())) {
            if (!e->basicBendMode()) {
                if (horizontal) {
                    if (e->inAngle() < 0) e->setInAngle(-180 - e->inAngle());
                    else e->setInAngle(180 - e->inAngle());

                    if (e->outAngle() < 0) e->setOutAngle(-180 - e->outAngle());
                    else e->setOutAngle(180 - e->outAngle());
                }
                else {
                    e->setInAngle(-e->inAngle());
                    e->setOutAngle(-e->outAngle());
                }
            }
            else {
                e->setBend(-e->bend());
            }
        }
    }
}

void Graph::rotateNodes(QSet<Node*> nds, bool clockwise)
{
    QRectF bds = boundsForNodes(nds);
    // QPointF ctr = bds.center();
    // ctr.setX((float)floor(ctr.x() * 4.0f) / 4.0f);
    // ctr.setY((float)floor(ctr.y() * 4.0f) / 4.0f);
    float sign = (clockwise) ? 1.0f : -1.0f;

    QPointF p;
    // float dx, dy;
    foreach(Node *n, nds) {
        p = n->point();
        // dx = p.x() - ctr.x();
        // dy = p.y() - ctr.y();
        n->setPoint(QPointF(sign * p.y(), -sign * p.x()));
    }

    int newIn, newOut;
    foreach (Edge *e, _edges) {
        if (nds.contains(e->source()) && nds.contains(e->target())) {
            // update angles if necessary. Note that "basic" bends are computed based
            // on node position, so they don't need to be updated.
            if (!e->basicBendMode()) {
                newIn = e->inAngle() - sign * 90;
                newOut = e->outAngle() - sign * 90;

                // normalise the angle to be within (-180,180]
                if (newIn > 180) newIn -= 360;
                else if (newIn <= -180) newIn += 360;
                if (newOut > 180) newOut -= 360;
                else if (newOut <= -180) newOut += 360;
                e->setInAngle(newIn);
                e->setOutAngle(newOut);
            }
        }
    }
}

void Graph::setBbox(const QRectF &bbox)
{
    _bbox = bbox;
}
