/**
  * Convenience class to hold the parser state while loading tikz graphs or projects.
  */

#ifndef TIKZASSEMBLER_H
#define TIKZASSEMBLER_H

#include "node.h"
#include "graph.h"
#include "tikzstyles.h"

#include <QObject>
#include <QHash>

class TikzAssembler : public QObject
{
    Q_OBJECT
public:
    explicit TikzAssembler(Graph *graph, QObject *parent = 0);
    explicit TikzAssembler(TikzStyles *tikzStyles, QObject *parent = 0);
    void addNodeToMap(Node *n);
    Node *nodeWithName(QString name);
    bool parse(const QString &tikz);

    Graph *graph() const;
    TikzStyles *tikzStyles() const;
    bool isGraph() const;
    bool isTikzStyles() const;


signals:

public slots:

private:
    QHash<QString,Node*> _nodeMap;
    Graph *_graph;
    TikzStyles *_tikzStyles;
    void *scanner;
};

#endif // TIKZASSEMBLER_H
