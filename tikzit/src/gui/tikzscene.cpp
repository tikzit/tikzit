#include "tikzit.h"
#include "util.h"
#include "tikzscene.h"
#include "undocommands.h"

#include <QPen>
#include <QBrush>
#include <QDebug>


TikzScene::TikzScene(TikzDocument *tikzDocument, QObject *parent) :
    QGraphicsScene(parent), _tikzDocument(tikzDocument)
{
    _modifyEdgeItem = 0;
}

TikzScene::~TikzScene() {
}

Graph *TikzScene::graph() const
{
    return _tikzDocument->graph();
}

void TikzScene::graphReplaced()
{
    foreach (NodeItem *ni, _nodeItems) {
        removeItem(ni);
        delete ni;
    }
    _nodeItems.clear();

    foreach (EdgeItem *ei, _edgeItems) {
        removeItem(ei);
        delete ei;
    }
    _edgeItems.clear();

    foreach (Edge *e, graph()->edges()) {
        EdgeItem *ei = new EdgeItem(e);
        _edgeItems << ei;
        addItem(ei);
    }

    foreach (Node *n, graph()->nodes()) {
        NodeItem *ni = new NodeItem(n);
        _nodeItems << ni;
        addItem(ni);
    }
}

void TikzScene::mousePressEvent(QGraphicsSceneMouseEvent *event)
{
    // current mouse position, in scene coordinates
    QPointF mousePos(event->buttonDownScenePos(Qt::LeftButton).x(),
                     event->buttonDownScenePos(Qt::LeftButton).y());

    // radius of a control point for bezier edges, in scene coordinates
    qreal cpR = GLOBAL_SCALEF * (0.05);
    qreal cpR2 = cpR * cpR;

    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        // check if we grabbed a control point of an edge
        foreach (QGraphicsItem *gi, selectedItems()) {
            if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
                qreal dx, dy;

                dx = ei->cp1Item()->pos().x() - mousePos.x();
                dy = ei->cp1Item()->pos().y() - mousePos.y();

                if (dx*dx + dy*dy <= cpR2) {
                    _modifyEdgeItem = ei;
                    _firstControlPoint = true;
                    break;
                }

                dx = ei->cp2Item()->pos().x() - mousePos.x();
                dy = ei->cp2Item()->pos().y() - mousePos.y();

                if (dx*dx + dy*dy <= cpR2) {
                    _modifyEdgeItem = ei;
                    _firstControlPoint = false;
                    break;
                }
            }
        }

        if (_modifyEdgeItem != 0) {
            // disable rubber band drag, which will clear the selection
            views()[0]->setDragMode(QGraphicsView::NoDrag);

            // store for undo purposes
            Edge *e = _modifyEdgeItem->edge();
            _oldBend = e->bend();
            _oldInAngle = e->inAngle();
            _oldOutAngle = e->outAngle();
            _oldWeight = e->weight();
        } else {
            // since we are not dragging a control point, process the click normally
            views()[0]->setDragMode(QGraphicsView::RubberBandDrag);
            QGraphicsScene::mousePressEvent(event);

            // save current node positions for undo support
            _oldNodePositions.clear();
            foreach (QGraphicsItem *gi, selectedItems()) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                    _oldNodePositions.insert(ni->node(), ni->node()->point());
                }
            }
        }

        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::mouseMoveEvent(QGraphicsSceneMouseEvent *event)
{
    // current mouse position, in scene coordinates

    QPointF mousePos = event->scenePos();

    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        if (_modifyEdgeItem != 0) {
            Edge *e = _modifyEdgeItem->edge();

            // dragging a control point
            QPointF src = toScreen(e->source()->point());
            QPointF targ = toScreen(e->target()->point());
            float dx1 = targ.x() - src.x();
            float dy1 = targ.y() - src.y();
            float dx2, dy2;
            if (_firstControlPoint) {
                dx2 = mousePos.x() - src.x();
                dy2 = mousePos.y() - src.y();
            } else {
                dx2 = mousePos.x() - targ.x();
                dy2 = mousePos.y() - targ.y();
            }

            float baseDist = sqrt(dx1*dx1 + dy1*dy1);
            float handleDist = sqrt(dx2*dx2 + dy2*dy2);
            float wcoarseness = 0.1f;

            if (!e->isSelfLoop()) {
                if (baseDist != 0) {
                    e->setWeight(roundToNearest(wcoarseness, handleDist/baseDist));
                } else {
                    e->setWeight(roundToNearest(wcoarseness, handleDist/GLOBAL_SCALEF));
                }
            }

            float control_angle = atan2(-dy2, dx2);

            int bcoarseness = 15;

            if(e->basicBendMode()) {
                float bnd;
                float base_angle = atan2(-dy1, dx1);
                if (_firstControlPoint) {
                    bnd = base_angle - control_angle;
                } else {
                    bnd = control_angle - base_angle + M_PI;
                    if (bnd > M_PI) bnd -= 2*M_PI;
                }

                e->setBend(round(bnd * (180.0f / M_PI) * (1.0f / (float)bcoarseness)) * bcoarseness);

            } else {
                int bnd = round(control_angle * (180.0f / M_PI) *
                                (1.0f / (float)bcoarseness)) *
                          bcoarseness;
                if (_firstControlPoint) {
                    // TODO: enable moving both control points
//                    if ([theEvent modifierFlags] & NSAlternateKeyMask) {
//                        if ([modifyEdge isSelfLoop]) {
//                            [modifyEdge setInAngle:[modifyEdge inAngle] +
//                             (bnd - [modifyEdge outAngle])];
//                        } else {
//                            [modifyEdge setInAngle:[modifyEdge inAngle] -
//                             (bnd - [modifyEdge outAngle])];
//                        }
//                    }

                    e->setOutAngle(bnd);
                } else {
//                    if (theEvent.modifierFlags & NSAlternateKeyMask) {
//                        if ([modifyEdge isSelfLoop]) {
//                            [modifyEdge setOutAngle:[modifyEdge outAngle] +
//                             (bnd - [modifyEdge inAngle])];
//                        } else {
//                            [modifyEdge setOutAngle:[modifyEdge outAngle] -
//                             (bnd - [modifyEdge inAngle])];
//                        }
//                    }

                    e->setInAngle(bnd);
                }
            }

            _modifyEdgeItem->readPos();

        } else {
            // otherwise, process mouse move normally
            QGraphicsScene::mouseMoveEvent(event);
            refreshAdjacentEdges(_oldNodePositions.keys());
        }

        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    switch (tikzit->toolPalette()->currentTool()) {
    case ToolPalette::SELECT:
        if (_modifyEdgeItem != 0) {
            // finished dragging a control point
            Edge *e = _modifyEdgeItem->edge();

            if (_oldWeight != e->weight() ||
                _oldBend != e->bend() ||
                _oldInAngle != e->inAngle() ||
                _oldOutAngle != e->outAngle())
            {
                EdgeBendCommand *cmd = new EdgeBendCommand(this, e, _oldWeight, _oldBend, _oldInAngle, _oldOutAngle);
                _tikzDocument->undoStack()->push(cmd);
            }

            _modifyEdgeItem = 0;
        } else {
            // otherwise, process mouse move normally
            QGraphicsScene::mouseReleaseEvent(event);

            if (!_oldNodePositions.empty()) {
                QMap<Node*,QPointF> newNodePositions;

                foreach (QGraphicsItem *gi, selectedItems()) {
                    if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                        ni->writePos();
                        newNodePositions.insert(ni->node(), ni->node()->point());
                    }
                }

                //qDebug() << _oldNodePositions;
                //qDebug() << newNodePositions;

                _tikzDocument->undoStack()->push(new MoveCommand(this, _oldNodePositions, newNodePositions));
                _oldNodePositions.clear();
            }
        }

        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        break;
    case ToolPalette::CROP:
        break;
    }
}

TikzDocument *TikzScene::tikzDocument() const
{
    return _tikzDocument;
}

void TikzScene::setTikzDocument(TikzDocument *tikzDocument)
{
    _tikzDocument = tikzDocument;
    graphReplaced();
}

QVector<EdgeItem *> TikzScene::edgeItems() const
{
    return _edgeItems;
}

void TikzScene::refreshAdjacentEdges(QList<Node*> nodes)
{
    if (nodes.empty()) return;
    foreach (EdgeItem *ei, _edgeItems) {
        if (nodes.contains(ei->edge()->source()) || nodes.contains(ei->edge()->target())) {
            ei->edge()->updateControls();
            ei->readPos();
        }
    }
}

QVector<NodeItem *> TikzScene::nodeItems() const
{
    return _nodeItems;
}
