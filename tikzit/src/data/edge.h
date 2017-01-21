#ifndef EDGE_H
#define EDGE_H

#include "graphelementdata.h"

#include <QObject>

class Node;

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

signals:

public slots:

private:
    Node *_source;
    Node *_target;
    GraphElementData *_data;
    QString _sourceAnchor;
    QString _targetAnchor;
};

#endif // EDGE_H
