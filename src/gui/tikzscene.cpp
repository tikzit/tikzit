#include "tikzit.h"
#include "util.h"
#include "tikzscene.h"
#include "undocommands.h"

#include <QPen>
#include <QBrush>
#include <QDebug>


TikzScene::TikzScene(TikzDocument *tikzDocument, ToolPalette *tools, QObject *parent) :
    QGraphicsScene(parent), _tikzDocument(tikzDocument), _tools(tools)
{
    _modifyEdgeItem = 0;
    _edgeStartNodeItem = 0;
    _drawEdgeItem = new QGraphicsLineItem();
    setSceneRect(-310,-230,620,450);

    QPen pen;
    pen.setColor(QColor::fromRgbF(0.5f, 0.0f, 0.5f));
    pen.setWidth(3);
    _drawEdgeItem->setPen(pen);
    _drawEdgeItem->setLine(0,0,0,0);
    _drawEdgeItem->setVisible(false);
    addItem(_drawEdgeItem);
}

TikzScene::~TikzScene() {
}

Graph *TikzScene::graph()
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
        _edgeItems.insert(e, ei);
        addItem(ei);
    }

    foreach (Node *n, graph()->nodes()) {
        NodeItem *ni = new NodeItem(n);
        _nodeItems.insert(n, ni);
        addItem(ni);
    }
}

void TikzScene::mousePressEvent(QGraphicsSceneMouseEvent *event)
{
    // current mouse position, in scene coordinates
    QPointF mousePos = event->scenePos();

    // disable rubber band drag, which will clear the selection. Only re-enable it
    // for the SELECT tool, and when no control point has been clicked.
    views()[0]->setDragMode(QGraphicsView::NoDrag);

    // radius of a control point for bezier edges, in scene coordinates
    qreal cpR = GLOBAL_SCALEF * (0.05);
    qreal cpR2 = cpR * cpR;

    switch (_tools->currentTool()) {
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
        foreach (QGraphicsItem *gi, items(mousePos)) {
            if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)){
                _edgeStartNodeItem = ni;
                _edgeEndNodeItem = ni;
                QLineF line(toScreen(ni->node()->point()), mousePos);
                _drawEdgeItem->setLine(line);
                _drawEdgeItem->setVisible(true);
                break;
            }
        }
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::mouseMoveEvent(QGraphicsSceneMouseEvent *event)
{
    // current mouse position, in scene coordinates
    QPointF mousePos = event->scenePos();
    QRectF rb = views()[0]->rubberBandRect();
    invalidate(-800,-800,1600,1600);

    switch (_tools->currentTool()) {
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
        if (_drawEdgeItem->isVisible()) {
            _edgeEndNodeItem = 0;
            foreach (QGraphicsItem *gi, items(mousePos)) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)){
                    _edgeEndNodeItem = ni;
                    break;
                }
            }
            QPointF p1 = _drawEdgeItem->line().p1();
            QPointF p2 = (_edgeEndNodeItem != 0) ? toScreen(_edgeEndNodeItem->node()->point()) : mousePos;
            QLineF line(p1, p2);

            _drawEdgeItem->setLine(line);
        }
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::mouseReleaseEvent(QGraphicsSceneMouseEvent *event)
{
    // current mouse position, in scene coordinates
    QPointF mousePos = event->scenePos();

    switch (_tools->currentTool()) {
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
        {
            int gridSize = GLOBAL_SCALE / 8;
            QPointF gridPos(round(mousePos.x()/gridSize)*gridSize, round(mousePos.y()/gridSize)*gridSize);
            Node *n = new Node(_tikzDocument);
            n->setPoint(fromScreen(gridPos));

            QRectF grow(gridPos.x() - GLOBAL_SCALEF, gridPos.y() - GLOBAL_SCALEF, 2 * GLOBAL_SCALEF, 2 * GLOBAL_SCALEF);
            QRectF newBounds = sceneRect().united(grow);
            //qDebug() << grow;
            //qDebug() << newBounds;

            AddNodeCommand *cmd = new AddNodeCommand(this, n, newBounds);
            _tikzDocument->undoStack()->push(cmd);
        }
        break;
    case ToolPalette::EDGE:
        if (_edgeStartNodeItem != 0 && _edgeEndNodeItem != 0) {
            Edge *e = new Edge(_edgeStartNodeItem->node(), _edgeEndNodeItem->node(), _tikzDocument);
            AddEdgeCommand *cmd = new AddEdgeCommand(this, e);
            _tikzDocument->undoStack()->push(cmd);
        }
        _edgeStartNodeItem = 0;
        _edgeEndNodeItem = 0;
        _drawEdgeItem->setVisible(false);
        break;
    case ToolPalette::CROP:
        break;
    }
}

void TikzScene::keyReleaseEvent(QKeyEvent *event)
{
    if (event->key() == Qt::Key_Backspace || event->key() == Qt::Key_Delete) {
        QSet<Node*> selNodes;
        QSet<Edge*> selEdges;
        getSelection(selNodes, selEdges);

        QMap<int,Node*> deleteNodes;
        QMap<int,Edge*> deleteEdges;

        for (int i = 0; i < _tikzDocument->graph()->nodes().length(); ++i) {
            Node *n = _tikzDocument->graph()->nodes()[i];
            if (selNodes.contains(n)) deleteNodes.insert(i, n);
        }

        for (int i = 0; i < _tikzDocument->graph()->edges().length(); ++i) {
            Edge *e = _tikzDocument->graph()->edges()[i];
            if (selEdges.contains(e) ||
                selNodes.contains(e->source()) ||
                selNodes.contains(e->target())) deleteEdges.insert(i, e);
        }

        //qDebug() << "nodes:" << deleteNodes;
        //qDebug() << "edges:" << deleteEdges;
        DeleteCommand *cmd = new DeleteCommand(this, deleteNodes, deleteEdges, selEdges);
        _tikzDocument->undoStack()->push(cmd);
    }
}

void TikzScene::mouseDoubleClickEvent(QGraphicsSceneMouseEvent *event)
{
    QPointF mousePos = event->scenePos();
    foreach (QGraphicsItem *gi, items(mousePos)) {
        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
            ChangeEdgeModeCommand *cmd = new ChangeEdgeModeCommand(this, ei->edge());
            _tikzDocument->undoStack()->push(cmd);
            break;
        }
    }
}

void TikzScene::getSelection(QSet<Node *> &selNodes, QSet<Edge *> &selEdges)
{
    foreach (QGraphicsItem *gi, selectedItems()) {
        if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) selNodes << ni->node();
        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) selEdges << ei->edge();
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

void TikzScene::setBounds(QRectF bounds)
{
    if (bounds != sceneRect()) {
        if (!views().empty()) {
            QGraphicsView *v = views().first();
            QPointF c = v->mapToScene(v->viewport()->rect().center());
            setSceneRect(bounds);
            v->centerOn(c);
        } else {
            setSceneRect(bounds);
        }
    }
}

QMap<Node*,NodeItem *> &TikzScene::nodeItems()
{
    return _nodeItems;
}

QMap<Edge*,EdgeItem*> &TikzScene::edgeItems()
{
    return _edgeItems;
}
