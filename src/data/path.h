#ifndef PATH_H
#define PATH_H

#include "edge.h"

#include <QObject>

class Path : public QObject
{
    Q_OBJECT
public:
    explicit Path(QObject *parent = nullptr);
    int length() const;
    void addEdge(Edge *e);
    void removeEdges();
    bool isCycle() const;

    QVector<Edge *> edges() const;

private:
    QVector<Edge*> _edges;

};

#endif // PATH_H
