#ifndef TIKZGRAPHASSEMBLER_H
#define TIKZGRAPHASSEMBLER_H

#include "node.h"

#include <QObject>
#include <QHash>

class TikzGraphAssembler : public QObject
{
    Q_OBJECT
public:
    explicit TikzGraphAssembler(QObject *parent = 0);
    void addNodeToMap(Node *n);
    Node *nodeWithName(QString name);

signals:

public slots:

private:
    QHash<QString,Node*> _nodeMap;
};

#endif // TIKZGRAPHASSEMBLER_H
