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

/*!
  * A graph defined by tikz code.
  */

#ifndef GRAPH_H
#define GRAPH_H

#include "node.h"
#include "edge.h"
#include "path.h"
#include "graphelementdata.h"

#include <QObject>
#include <QVector>
#include <QMultiHash>
#include <QRectF>
#include <QString>
#include <QMap>

class Graph : public QObject
{
    Q_OBJECT
public:
    explicit Graph(QObject *parent = 0);
    ~Graph();
    void addNode(Node *n);
    void addNode(Node *n, int index);
    void removeNode(Node *n);
    void addEdge(Edge *e);
    void addEdge(Edge *e, int index);
    void removeEdge(Edge *e);
    void addPath(Path *p);
    void removePath(Path *p);
    int maxIntName();
    void reorderNodes(const QVector<Node*> &newOrder);
    void reorderEdges(const QVector<Edge*> &newOrder);
	QRectF boundsForNodes(QSet<Node*> ns);
	QString freshNodeName();

    /*!
     * \brief renameApart assigns fresh names to all of the nodes in "this",
     * with respect to the given graph
     * \param graph
     */
    void renameApart(Graph *graph);

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    const QVector<Node *> &nodes();
    const QVector<Edge*> &edges();
    const QVector<Path*> &paths();

    QRectF bbox() const;
    void setBbox(const QRectF &bbox);
    bool hasBbox();
    void clearBbox();

    /*!
     * \brief realBbox computes the union of the user-defined
     * bounding box, and the bounding boxes of the graph's
     * contents.
     *
     * \return
     */
    QRectF realBbox();

    QString tikz();

    /*!
     * \brief copyOfSubgraphWithNodes produces a copy of the full subgraph
     * with the given nodes. Used for cutting and copying to clipboard.
     * \param nds
     * \return
     */
    Graph *copyOfSubgraphWithNodes(QSet<Node*> nds);

    /*!
     * \brief insertGraph inserts the given graph into "this". Prior to calling this
     * method, the node names in the given graph should be made fresh via
     * "renameApart". Note that the parameter "graph" relinquishes ownership of its
     * nodes and edges, so it should be not be allowed to exist longer than "this".
     * \param graph
     */
    void insertGraph(Graph *graph);

    /*!
     * \brief reflectNodes flips the given set of nodes horizontally or vertically,
     * depending on the value of the second parameter.
     * \param nds a set of nodes to flip
     * \param horizontal a boolean determining whether to flip horizontally or
     *                   vertically
     */
    void reflectNodes(QSet<Node*> nds, bool horizontal);

    /*!
     * \brief rotateNodes rotates the given set of nodes clockwise or counter-clockwise,
     * depending on the value of the second parameter.
     * \param nds a set of nodes to flip
     * \param clockwose a boolean determining whether to rotate clockwise or counter-clockwise
     */
    void rotateNodes(QSet<Node*> nds, bool clockwise);
signals:

public slots:

private:
    QVector<Node*> _nodes;
    QVector<Edge*> _edges;
    QVector<Path*> _paths;
    //QMultiHash<Node*,Edge*> inEdges;
    //QMultiHash<Node*,Edge*> outEdges;
    GraphElementData *_data;
    QRectF _bbox;
};

#endif // GRAPH_H
