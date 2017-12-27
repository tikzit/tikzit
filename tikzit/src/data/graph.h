/**
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

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    const QVector<Node *> &nodes();
    const QVector<Edge*> &edges();

    QRectF bbox() const;
    void setBbox(const QRectF &bbox);
    bool hasBbox();
    void clearBbox();

    QString tikz();
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
