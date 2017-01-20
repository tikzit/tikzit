#ifndef EDGE_H
#define EDGE_H

#include <QObject>

class Node;

class Edge : public QObject
{
    Q_OBJECT
public:
    explicit Edge(Node *s, Node *t, QObject *parent = 0);

    Node *source() const;
    Node *target() const;

signals:

public slots:

private:
    Node *_source;
    Node *_target;
};

#endif // EDGE_H
