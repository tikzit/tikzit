/*!
  * A graph defined by tikz code.
  */

#ifndef GRAPH_H
#define GRAPH_H

#include "node.h"
#include "edge.h"
#include "graphelementdata.h"

#include <QObject>
#include <QVector>
#include <QMultiHash>
#include <QRectF>
#include <QString>

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
    int maxIntName();
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
signals:

public slots:

private:
    QVector<Node*> _nodes;
    QVector<Edge*> _edges;
    //QMultiHash<Node*,Edge*> inEdges;
    //QMultiHash<Node*,Edge*> outEdges;
    GraphElementData *_data;
    QRectF _bbox;
};

#endif // GRAPH_H
