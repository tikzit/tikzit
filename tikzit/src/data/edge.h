#ifndef EDGE_H
#define EDGE_H

#include "graphelementdata.h"
#include "node.h"

#include <QObject>
#include <QPointF>

class Edge : public QObject
{
    Q_OBJECT
public:
    explicit Edge(Node *s, Node *t, QObject *parent = 0);
    ~Edge();

    Node *source() const;
    Node *target() const;

    bool isSelfLoop();
    bool isStraight();

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    QString sourceAnchor() const;
    void setSourceAnchor(const QString &sourceAnchor);

    QString targetAnchor() const;
    void setTargetAnchor(const QString &targetAnchor);

    Node *edgeNode() const;
    void setEdgeNode(Node *edgeNode);
    bool hasEdgeNode();

    void updateControls();
    void setAttributesFromData();
    void updateData();

    QPointF head() const;
    QPointF tail() const;
    QPointF cp1() const;
    QPointF cp2() const;
    QPointF mid() const;

    int bend() const;
    int inAngle() const;
    int outAngle() const;
    float weight() const;
    bool basicBendMode() const;
    float cpDist() const;

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

    bool _dirty;
    bool _basicBendMode;
    int _bend;
    int _inAngle;
    int _outAngle;
    float _weight;
    float _cpDist;

    QPointF _head;
    QPointF _tail;
    QPointF _cp1;
    QPointF _cp2;
    QPointF _mid;
};

#endif // EDGE_H
