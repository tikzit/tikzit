/**
  * Manage the scene, which contains a single Graph, and respond to user input. This serves as
  * the controller for the MVC (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include "graph.h"
#include "nodeitem.h"
#include "edgeitem.h"
#include "tikzdocument.h"

#include <QWidget>
#include <QGraphicsScene>
#include <QPainter>
#include <QRectF>
#include <QVector>
#include <QGraphicsEllipseItem>
#include <QGraphicsSceneMouseEvent>

class TikzScene : public QGraphicsScene
{
    Q_OBJECT
public:
    TikzScene(TikzDocument *tikzDocument, QObject *parent);
    ~TikzScene();
    Graph *graph();
    QMap<Node*,NodeItem*> &nodeItems();
    QMap<Edge*,EdgeItem*> &edgeItems();
    void refreshAdjacentEdges(QList<Node*> nodes);
    void setBounds(QRectF bounds);

    TikzDocument *tikzDocument() const;
    void setTikzDocument(TikzDocument *tikzDocument);

public slots:
    void graphReplaced();

protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event) override;
    void mouseMoveEvent(QGraphicsSceneMouseEvent *event) override;
    void mouseReleaseEvent(QGraphicsSceneMouseEvent *event) override;
    void keyReleaseEvent(QKeyEvent *event) override;
private:
    TikzDocument *_tikzDocument;
    QMap<Node*,NodeItem*> _nodeItems;
    QMap<Edge*,EdgeItem*> _edgeItems;
    QGraphicsLineItem *_drawEdgeItem;
    EdgeItem *_modifyEdgeItem;
    bool _firstControlPoint;

    QMap<Node*,QPointF> _oldNodePositions;
    float _oldWeight;
    int _oldBend;
    int _oldInAngle;
    int _oldOutAngle;

    void getSelection(QSet<Node*> &selNodes, QSet<Edge*> &selEdges);
};

#endif // TIKZSCENE_H
