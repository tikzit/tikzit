#ifndef EDGE_H
#define EDGE_H

#include "graphelementdata.h"
#include "node.h"

#include <QObject>

class Edge : public QObject
{
    Q_OBJECT
public:
    explicit Edge(Node *s, Node *t, QObject *parent = 0);
    ~Edge();

    Node *source() const;
    Node *target() const;

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    QString sourceAnchor() const;
    void setSourceAnchor(const QString &sourceAnchor);

    QString targetAnchor() const;
    void setTargetAnchor(const QString &targetAnchor);

    Node *edgeNode() const;
    void setEdgeNode(Node *edgeNode);
    bool hasEdgeNode();

signals:

public slots:

private:
    QString _sourceAnchor;
    QString _targetAnchor;

    // owned
    Node *_edgeNode;
    GraphElementData *_data;

    // referenced
    Node *_source;
    Node *_target;
};

#endif // EDGE_H
