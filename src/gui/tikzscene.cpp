/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

#include "tikzit.h"
#include "util.h"
#include "tikzscene.h"
#include "undocommands.h"
#include "tikzassembler.h"

#include <QPen>
#include <QBrush>
#include <QDebug>
#include <QClipboard>
#include <QInputDialog>
#include <QMessageBox>
#include <cmath>
#include <delimitedstringvalidator.h>
#include <QSettings>


TikzScene::TikzScene(TikzDocument *tikzDocument, ToolPalette *tools,
                     StylePalette *styles, QObject *parent) :
    QGraphicsScene(parent), _tikzDocument(tikzDocument), _tools(tools), _styles(styles)
{
    _modifyEdgeItem = nullptr;
    _edgeStartNodeItem = nullptr;
    _drawNodeLabels = true;
    _drawEdgeItem = new QGraphicsLineItem();
    _rubberBandItem = new QGraphicsRectItem();
    _enabled = true;
    //setSceneRect(-310,-230,620,450);
    //setSceneRect(-2000,-1500,4000,3000);
    refreshSceneBounds();

    QPen pen;
    pen.setColor(QColor::fromRgbF(0.5, 0.0, 0.5));
    //pen.setWidth(3.0f);
    pen.setCosmetic(true);
    _drawEdgeItem->setPen(pen);
    _drawEdgeItem->setLine(0,0,0,0);
    _drawEdgeItem->setVisible(false);
    addItem(_drawEdgeItem);

    pen.setColor(QColor::fromRgbF(0.6, 0.6, 0.8));
    //pen.setWidth(3.0f);
    //QVector<qreal> dash;
    //dash << 4.0 << 4.0;
    pen.setStyle(Qt::DashLine);
    //pen.setDashPattern(dash);
    _rubberBandItem->setPen(pen);

    QBrush brush(QColor::fromRgbF(0.6,0.6,0.8,0.2));
    _rubberBandItem->setBrush(brush);

    _rubberBandItem->setVisible(false);
    addItem(_rubberBandItem);

    _highlightHeads = false;
    _highlightTails = false;
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

    foreach (PathItem *pi, _pathItems) {
        removeItem(pi);
        delete pi;
    }
    _pathItems.clear();

    foreach (Edge *e, graph()->edges()) {
		//e->attachStyle();
        //e->updateControls();
        EdgeItem *ei = new EdgeItem(e);
        _edgeItems.insert(e, ei);
        addItem(ei);

        Path *p = e->path();
        if (p && p->edges().first() == e) {
            PathItem *pi = new PathItem(p);
            _pathItems.insert(p, pi);
            addItem(pi);
        }
    }

    foreach (Node *n, graph()->nodes()) {
        //n->attachStyle();
        NodeItem *ni = new NodeItem(n);
        _nodeItems.insert(n, ni);
        addItem(ni);
    }

    refreshZIndices();
    refreshSceneBounds();
}

void TikzScene::extendSelectionUp()
{
    bool found = false;
    qreal m = 0.0;
    foreach (Node *n, getSelectedNodes()) {
        if (!found) {
            m = n->point().y();
            found = true;
        } else {
            if (n->point().y() > m) m = n->point().y();
        }
    }

    foreach (NodeItem *ni, nodeItems().values()) {
        if (ni->node()->point().y() >= m) ni->setSelected(true);
    }
}

void TikzScene::extendSelectionDown()
{
    bool found = false;
    qreal m = 0.0;
    foreach (Node *n, getSelectedNodes()) {
        if (!found) {
            m = n->point().y();
            found = true;
        } else {
            if (n->point().y() < m) m = n->point().y();
        }
    }

    foreach (NodeItem *ni, nodeItems().values()) {
        if (ni->node()->point().y() <= m) ni->setSelected(true);
    }
}

void TikzScene::extendSelectionLeft()
{
    bool found = false;
    qreal m = 0.0;
    foreach (Node *n, getSelectedNodes()) {
        if (!found) {
            m = n->point().x();
            found = true;
        } else {
            if (n->point().x() < m) m = n->point().x();
        }
    }

    foreach (NodeItem *ni, nodeItems().values()) {
        if (ni->node()->point().x() <= m) ni->setSelected(true);
    }
}

void TikzScene::extendSelectionRight()
{
    bool found = false;
    qreal m = 0.0;
    foreach (Node *n, getSelectedNodes()) {
        if (!found) {
            m = n->point().x();
            found = true;
        } else {
            if (n->point().x() < m) m = n->point().x();
        }
    }

    foreach (NodeItem *ni, nodeItems().values()) {
        if (ni->node()->point().x() >= m) ni->setSelected(true);
    }
}

void TikzScene::mergeNodes()
{
    refreshZIndices();
    QSet<Node*> selNodes;
    QSet<Edge*> selEdges;
    getSelection(selNodes, selEdges);

    // build a map from locations to a chosen node at that location
    QMap<QPair<int,int>,Node*> m;
    foreach (Node *n, selNodes) {
        // used fixed precision for hashing/comparing locations
        QPair<int,int> fpPoint(
          static_cast<int>(n->point().x() * 1000.0),
          static_cast<int>(n->point().y() * 1000.0));
        if (!m.contains(fpPoint) ||
            _nodeItems[m[fpPoint]]->zValue() < _nodeItems[n]->zValue())
        {
            m.insert(fpPoint, n);
        }
    }

    // build a second map from nodes to the node they will be merged with
    QMap<Node*,Node*> m1;
    foreach (Node *n, graph()->nodes()) {
        QPair<int,int> fpPoint(
          static_cast<int>(n->point().x() * 1000.0),
          static_cast<int>(n->point().y() * 1000.0));
        Node *n1 = m[fpPoint];
        if (n1 != nullptr && n1 != n) m1.insert(n, n1);
    }

    _tikzDocument->undoStack()->beginMacro("Merge nodes");

    // copy adjacent edges from nodes that will be deleted
    foreach (Edge *e, graph()->edges()) {
        if (m1.contains(e->source()) || m1.contains(e->target())) {
            Edge *e1 = e->copy(&m1);
            AddEdgeCommand *cmd = new AddEdgeCommand(this, e1);
            _tikzDocument->undoStack()->push(cmd);
        }
    }

    // delete nodes
    QMap<int,Node*> delNodes;
    QMap<int,Edge*> delEdges;
    for (int i = 0; i < _tikzDocument->graph()->nodes().length(); ++i) {
        Node *n = _tikzDocument->graph()->nodes()[i];
        if (m1.contains(n)) delNodes.insert(i, n);
    }

    QSet<Path*> delPaths;
    for (int i = 0; i < _tikzDocument->graph()->edges().length(); ++i) {
        Edge *e = _tikzDocument->graph()->edges()[i];
        if (m1.contains(e->source()) || m1.contains(e->target())) {
            delEdges.insert(i, e);
            if (e->path()) delPaths << e->path();
        }
    }
    _tikzDocument->undoStack()->push(new SplitPathCommand(this, delPaths));
    _tikzDocument->undoStack()->push(new DeleteCommand(this, delNodes, delEdges,
                                                       selNodes, selEdges));

    _tikzDocument->undoStack()->endMacro();
}

void TikzScene::reorderSelection(bool toFront)
{
    QVector<Node*> nodeOrd, nodeOrd1;
    QVector<Edge*> edgeOrd, edgeOrd1;
    QSet<Node*> selNodes;
    QSet<Edge*> selEdges;
    getSelection(selNodes, selEdges);
    foreach (Node *n, graph()->nodes()) {
        if (selNodes.contains(n)) nodeOrd1 << n;
        else nodeOrd << n;
    }

    foreach (Edge *e, graph()->edges()) {
        if (selEdges.contains(e)) edgeOrd1 << e;
        else edgeOrd << e;
    }

    if (toFront) {
        nodeOrd += nodeOrd1;
        edgeOrd += edgeOrd1;
    } else {
        nodeOrd = nodeOrd1 + nodeOrd;
        edgeOrd = edgeOrd1 + edgeOrd;
    }

    ReorderCommand *cmd = new ReorderCommand(this, graph()->nodes(), nodeOrd, graph()->edges(), edgeOrd);
    _tikzDocument->undoStack()->push(cmd);
}

void TikzScene::reverseSelectedEdges()
{
    // grab all the edges which are either selected themselves, or where
    // both their source and target nodes are selected
    QSet<Edge*> es;
    foreach (Edge *e, graph()->edges()) {
        if ((_edgeItems[e] && _edgeItems[e]->isSelected()) ||
            (_nodeItems[e->source()] && _nodeItems[e->target()] &&
             _nodeItems[e->source()]->isSelected() &&
             _nodeItems[e->target()]->isSelected()))
        {
            es << e;
        }
    }

    ReverseEdgesCommand *cmd = new ReverseEdgesCommand(this, es);
    _tikzDocument->undoStack()->push(cmd);
}

void TikzScene::makePath(bool duplicateEdges)
{
    QSet<Node*> selNodes;
    QSet<Edge*> selEdges;
    QSet<Edge*> edges;
    getSelection(selNodes, selEdges);

    edges = selEdges;

    // if no edges are selected, try to infer edges from nodes
    if (edges.isEmpty()) {
        foreach(Edge *e, graph()->edges()) {
            if (selNodes.contains(e->source()) && selNodes.contains(e->target()))
                edges << e;
        }
    }

    if (edges.size() < 2) {
        //QMessageBox::warning(nullptr, "Error", "Paths must contain at least 2 edges.");
        return;
    }

    foreach (Edge *e, edges) {
        if (e->path() != nullptr && !duplicateEdges) {
            //QMessageBox::warning(nullptr, "Error", "Edges must not already be in another path.");
            // TODO: maybe we want to automatically split paths if edges are in a path already?
            return;
        }
    }

    _tikzDocument->undoStack()->beginMacro("Make Path");
    
    QVector<Edge *> oldEdgeOrder = graph()->edges();
    QSet<Edge *> oldEdges, newEdges;
    oldEdges = edges;

    if (duplicateEdges) {
        foreach (Edge *e, edges) {
            Edge *e1 = e->copy();
            _tikzDocument->undoStack()->push(new AddEdgeCommand(this, e1, false, selNodes, selEdges));
            newEdges << e1;
            oldEdgeOrder << e1;
        }
        edges = newEdges;
    }

    // try to turn selected edges into one contiguous chain or cycle, recording
    // which edges need to be flipped.

    // n.b. this is O(n^2) in path length. This could be optimised by saving
    // vertex neighbourhoods, but probably doesn't win anything for n < 100.

    QSet<Edge*> flip;
    QVector<Edge*> p;
    int pLen = -1;

    // keep going as long as 'p' grows
    while (pLen < p.length()) {
        pLen = p.length();
        Edge *e = nullptr;
        foreach (e, edges) {
            Node *s = e->source();
            Node *t = e->target();
            if (p.isEmpty()) {
                p.append(e);
                break;
            }

            Node *head = (flip.contains(p.first())) ? p.first()->target() : p.first()->source();
            Node *tail = (flip.contains(p.last())) ? p.last()->source() : p.last()->target();

            if (s == head || t == head) {
                if (s == head) flip << e;
                p.prepend(e);
                break;
            }

            if (s == tail || t == tail) {
                if (t == tail) flip << e;
                p.append(e);
                break;
            }
        }

        if (e) edges.remove(e);
    }

    if (!edges.isEmpty()) {
        QMessageBox::warning(nullptr, "Error", "Selected edges do not form a path.");
        return;
    }

    _tikzDocument->undoStack()->push(new ReverseEdgesCommand(this, flip));

    // order all of the edges together, and in the case of
    // duplicate edges, just below the first original.
    QVector<Edge*> newEdgeOrder;
    bool firstEdge = true;
    foreach (Edge *e, oldEdgeOrder) {
        if (oldEdges.contains(e)) {
            if (firstEdge) {
                newEdgeOrder += p;
                firstEdge = false;
            }

            if (duplicateEdges) newEdgeOrder << e;
        } else if (!newEdges.contains(e)) {
            newEdgeOrder << e;
        }
    }

    _tikzDocument->undoStack()->push(new ReorderCommand(this,
        graph()->nodes(), graph()->nodes(), oldEdgeOrder, newEdgeOrder));

    QMap<Edge*, GraphElementData*> oldEdgeData;
    foreach (Edge *e, p) {
        if (e != p.first()) oldEdgeData[e] = e->data()->copy();
    }

    _tikzDocument->undoStack()->push(new MakePathCommand(this, p, oldEdgeData));
    _tikzDocument->undoStack()->endMacro();
}

void TikzScene::splitPath()
{
    QSet<Node*> selNodes;
    QSet<Edge*> edges;
    getSelection(selNodes, edges);

    // if no edges are selected, try to infer edges from nodes
    if (edges.isEmpty()) {
        foreach(Edge *e, graph()->edges()) {
            if (selNodes.contains(e->source()) && selNodes.contains(e->target()))
                edges << e;
        }
    }

    QSet<Path*> paths;
    foreach (Edge *e, edges) {
        if (e->path()) paths << e->path();
    }

    _tikzDocument->undoStack()->push(new SplitPathCommand(this, paths));
}

void TikzScene::refreshZIndices()
{
    qreal z = 0.0;
    foreach (Edge *e, graph()->edges()) {
        if (e->path() && e == e->path()->edges().first()) {
            pathItems()[e->path()]->setZValue(z);
            edgeItems()[e]->setZValue(z + 0.1);
        } else {
            edgeItems()[e]->setZValue(z);
        }
        z += 1.0;
    }

    foreach (Node *n, graph()->nodes()) {
        nodeItems()[n]->setZValue(z);
        z += 1.0;
    }
}

void TikzScene::mousePressEvent(QGraphicsSceneMouseEvent *event)
{
    QSettings settings("tikzit", "tikzit");
    if (!_enabled) return;

    // current mouse position, in scene coordinates
    _mouseDownPos = event->scenePos();

    _draggingNodes = false;
    _selectingEdge = nullptr;

    // radius of a control point for bezier edges, in scene coordinates
    qreal cpR = GLOBAL_SCALEF * (0.1);
    qreal cpR2 = cpR * cpR;

    if (event->button() == Qt::RightButton &&
        _tools->currentTool() == ToolPalette::SELECT &&
        settings.value("smart-tool-enabled", true).toBool())
    {
        _smartTool = true;
        if (!items(_mouseDownPos).isEmpty() &&
            dynamic_cast<NodeItem*>(items(_mouseDownPos)[0]))
        {
            _tools->setCurrentTool(ToolPalette::EDGE);
        } else {
            _tools->setCurrentTool(ToolPalette::VERTEX);
        }
    }

    switch (_tools->currentTool()) {
    case ToolPalette::SELECT:
        // check if we grabbed a control point of an edge
        foreach (QGraphicsItem *gi, selectedItems()) {
            if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
                qreal dx, dy;

                dx = ei->cp1Item()->pos().x() - _mouseDownPos.x();
                dy = ei->cp1Item()->pos().y() - _mouseDownPos.y();

                if (dx*dx + dy*dy <= cpR2) {
                    _modifyEdgeItem = ei;
                    _firstControlPoint = true;
                    break;
                }

                dx = ei->cp2Item()->pos().x() - _mouseDownPos.x();
                dy = ei->cp2Item()->pos().y() - _mouseDownPos.y();

                if (dx*dx + dy*dy <= cpR2) {
                    _modifyEdgeItem = ei;
                    _firstControlPoint = false;
                    break;
                }
            }
        }

        if (_modifyEdgeItem != nullptr) {
            // store for undo purposes
            Edge *e = _modifyEdgeItem->edge();
            _oldBend = e->bend();
            _oldInAngle = e->inAngle();
            _oldOutAngle = e->outAngle();
            _oldWeight = e->weight();
        } else {
            // since we are not dragging a control point, process the click normally
            //views()[0]->setDragMode(QGraphicsView::RubberBandDrag);
            QGraphicsScene::mousePressEvent(event);

            if (items(_mouseDownPos).isEmpty()) {
                _rubberBandItem->setRect(QRectF(_mouseDownPos,_mouseDownPos));
                _rubberBandItem->setVisible(true);
                //qDebug() << "starting rubber band drag";
            }

//            foreach (QGraphicsItem *gi, items()) {
//                if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
//                    //qDebug() << "got an edge item: " << ei;
//                    ei->setFlag(QGraphicsItem::ItemIsSelectable, false);
//                    //ei->setSelected(true);
//                }
//            }

            // save current node positions for undo support
            _oldNodePositions.clear();
            foreach (QGraphicsItem *gi, selectedItems()) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                    _oldNodePositions.insert(ni->node(), ni->node()->point());
                }
            }

            QList<QGraphicsItem*> its = items(_mouseDownPos);
            if (!its.isEmpty()) {
                if (dynamic_cast<NodeItem*>(its[0])) {
                    _draggingNodes = true;
                } else {
                    foreach (QGraphicsItem *gi, its) {
                        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
                            _selectingEdge = ei->edge();
                            break;
                        }
                    }
                }
            }
        }

        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        foreach (QGraphicsItem *gi, items(_mouseDownPos)) {
            if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)){
                _edgeStartNodeItem = ni;
                _edgeEndNodeItem = ni;
                QLineF line(toScreen(ni->node()->point()), _mouseDownPos);
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
    if (!_enabled) return;

    // current mouse position, in scene coordinates
    QPointF mousePos = event->scenePos();
    //QRectF rb = views()[0]->rubberBandRect();
    //invalidate(-800,-800,1600,1600);
    //invalidate(QRectF(), QGraphicsScene::BackgroundLayer);

    switch (_tools->currentTool()) {
    case ToolPalette::SELECT:
        if (_modifyEdgeItem != nullptr) {
            Edge *e = _modifyEdgeItem->edge();

            // dragging a control point
            QPointF src = toScreen(e->source()->point());
            QPointF targ = toScreen(e->target()->point());
            qreal dx1 = targ.x() - src.x();
            qreal dy1 = targ.y() - src.y();
            qreal dx2, dy2;
            if (_firstControlPoint) {
                dx2 = mousePos.x() - src.x();
                dy2 = mousePos.y() - src.y();
            } else {
                dx2 = mousePos.x() - targ.x();
                dy2 = mousePos.y() - targ.y();
            }

            qreal baseDist = sqrt(dx1*dx1 + dy1*dy1);
            qreal handleDist = sqrt(dx2*dx2 + dy2*dy2);
            qreal wcoarseness = 0.1;

            if (!e->isSelfLoop()) {
                if (baseDist != 0.0) {
                    e->setWeight(roundToNearest(wcoarseness, handleDist/baseDist));
                } else {
                    e->setWeight(roundToNearest(wcoarseness, handleDist/GLOBAL_SCALEF));
                }
            }

            qreal control_angle = atan2(-dy2, dx2);

            int bcoarseness = 15;
            qreal bcoarsenessi = 1.0/15.0;

            if(e->basicBendMode()) {
                qreal bnd;
                qreal base_angle = atan2(-dy1, dx1);
                if (_firstControlPoint) {
                    bnd = base_angle - control_angle;
                } else {
                    bnd = control_angle - base_angle + M_PI;
                    if (bnd > M_PI) bnd -= 2*M_PI;
                }

                e->setBend(static_cast<int>(round(bnd * (180.0 / M_PI) * bcoarsenessi)) * bcoarseness);

            } else {
                int bnd = static_cast<int>(round(control_angle * (180.0 / M_PI) * bcoarsenessi)) * bcoarseness;
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
            Path *p = _modifyEdgeItem->edge()->path();
            if (p) pathItems()[p]->readPos();

        } else if (_draggingNodes) { // nodes being dragged
            QGraphicsScene::mouseMoveEvent(event);

            // apply the same offset to all nodes, otherwise we get odd rounding behaviour with
            // multiple selection.
            QPointF shift = mousePos - _mouseDownPos;
            shift = QPointF(round(shift.x()/GRID_SEP)*GRID_SEP, round(shift.y()/GRID_SEP)*GRID_SEP);

            foreach (Node *n, _oldNodePositions.keys()) {
                NodeItem *ni = _nodeItems[n];

				// in (rare) cases, the graph can change while we are dragging
				if (ni != nullptr) {
					ni->setPos(toScreen(_oldNodePositions[n]) + shift);
					ni->writePos();
				}
            }

            refreshAdjacentEdges(_oldNodePositions.keys());
        } else {
            // otherwise, process mouse move normally
            QGraphicsScene::mouseMoveEvent(event);

            if (_rubberBandItem->isVisible()) {
                qreal left = std::min(_mouseDownPos.x(), mousePos.x());
                qreal top = std::min(_mouseDownPos.y(), mousePos.y());
                qreal w = std::abs(_mouseDownPos.x() - mousePos.x());
                qreal h = std::abs(_mouseDownPos.y() - mousePos.y());

                _rubberBandItem->setRect(QRectF(left, top, w, h));
            }
        }

        break;
    case ToolPalette::VERTEX:
        break;
    case ToolPalette::EDGE:
        if (_drawEdgeItem->isVisible()) {
            _edgeEndNodeItem = nullptr;
            foreach (QGraphicsItem *gi, items(mousePos)) {
                if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)){
                    _edgeEndNodeItem = ni;
                    break;
                }
            }
            QPointF p1 = _drawEdgeItem->line().p1();
            QPointF p2 = (_edgeEndNodeItem != nullptr) ? toScreen(_edgeEndNodeItem->node()->point()) : mousePos;
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
    if (!_enabled) return;
    QSettings settings("tikzit", "tikzit");

    // current mouse position, in scene coordinates
    QPointF mousePos = event->scenePos();

    switch (_tools->currentTool()) {
    case ToolPalette::SELECT:
        if (_modifyEdgeItem != nullptr) {
            // finished dragging a control point
            Edge *e = _modifyEdgeItem->edge();

            if (!almostEqual(_oldWeight, e->weight()) ||
                _oldBend != e->bend() ||
                _oldInAngle != e->inAngle() ||
                _oldOutAngle != e->outAngle())
            {
                EdgeBendCommand *cmd = new EdgeBendCommand(this, e, _oldWeight, _oldBend, _oldInAngle, _oldOutAngle);
                _tikzDocument->undoStack()->push(cmd);
            }

            _modifyEdgeItem = nullptr;
        } else {
            // otherwise, process mouse move normally
            QGraphicsScene::mouseReleaseEvent(event);

            if (_selectingEdge) {
                bool sel = edgeItems()[_selectingEdge]->isSelected();
                Path *p = _selectingEdge->path();
                if (p) {
                    foreach (Edge *e, p->edges()) {
                        if (e != _selectingEdge)
                            edgeItems()[e]->setSelected(sel);
                        nodeItems()[e->source()]->setSelected(sel);
                        nodeItems()[e->target()]->setSelected(sel);
                    }
                }
//                else {
//                    nodeItems()[_selectingEdge->source()]->setSelected(sel);
//                    nodeItems()[_selectingEdge->target()]->setSelected(sel);
//                }
            }

            if (_rubberBandItem->isVisible()) {
                QPainterPath sel;
                sel.addRect(_rubberBandItem->rect());
                foreach (QGraphicsItem *gi, items()) {
                    if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                        if (sel.contains(toScreen(ni->node()->point()))) ni->setSelected(true);
                    }
                }
                //setSelectionArea(sel);
            }

            _rubberBandItem->setVisible(false);

            if (!_oldNodePositions.empty()) {
                QPointF shift = mousePos - _mouseDownPos;
                shift = QPointF(round(shift.x()/GRID_SEP)*GRID_SEP, round(shift.y()/GRID_SEP)*GRID_SEP);

                if (shift.x() != 0.0 || shift.y() != 0.0) {
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
                }

                _oldNodePositions.clear();
            }
        }

        break;
    case ToolPalette::VERTEX:
        {
            QPointF gridPos(round(mousePos.x()/GRID_SEP)*GRID_SEP, round(mousePos.y()/GRID_SEP)*GRID_SEP);
            Node *n = new Node(_tikzDocument);
            n->setName(graph()->freshNodeName());
            n->setPoint(fromScreen(gridPos));
            n->setStyleName(_styles->activeNodeStyleName());

            QRectF grow(gridPos.x() - GLOBAL_SCALEF, gridPos.y() - GLOBAL_SCALEF, 2 * GLOBAL_SCALEF, 2 * GLOBAL_SCALEF);
            QRectF newBounds = sceneRect().united(grow);
            //qDebug() << grow;
            //qDebug() << newBounds;

            AddNodeCommand *cmd = new AddNodeCommand(this, n, newBounds);
            _tikzDocument->undoStack()->push(cmd);
        }
        break;
    case ToolPalette::EDGE:
        // add an edge
        if (_edgeStartNodeItem != nullptr && _edgeEndNodeItem != nullptr) {
            Edge *e = new Edge(_edgeStartNodeItem->node(), _edgeEndNodeItem->node(), _tikzDocument);
			e->setStyleName(_styles->activeEdgeStyleName());

            bool selectEdge = settings.value("select-new-edges", false).toBool();
            QSet<Node*> selNodes;
            QSet<Edge*> selEdges;
            if (selectEdge) getSelection(selNodes, selEdges);
            AddEdgeCommand *cmd = new AddEdgeCommand(this, e, selectEdge,
                                                     selNodes, selEdges);
            _tikzDocument->undoStack()->push(cmd);
        }
        _edgeStartNodeItem = nullptr;
        _edgeEndNodeItem = nullptr;
        _drawEdgeItem->setVisible(false);
        break;
    case ToolPalette::CROP:
        break;
    }

    if (_smartTool) {
        _tools->setCurrentTool(ToolPalette::SELECT);
    }

    _smartTool = false;

    // clear artefacts from rubber band selection
    invalidate(QRect(), QGraphicsScene::BackgroundLayer);
}



void TikzScene::keyReleaseEvent(QKeyEvent *event)
{
    //qDebug() << "keyrelease:" << QString::number(event->key(), 16);
    //qDebug() << "modifiers:" << QString::number(QApplication::queryKeyboardModifiers(), 16);
    if (!_enabled) return;

    // slower, but seems to be more reliable than event->modifiers()
    Qt::KeyboardModifiers mod = QApplication::queryKeyboardModifiers();

    // clear highlighting for edge bends (if there was any)
    if (mod & Qt::ControlModifier) {
        // it could be the case the user has released shift and is still holding control
        bool head = !(mod & Qt::ShiftModifier);
        _highlightHeads = head;
        _highlightTails = !head;
    } else {
        _highlightHeads = false;
        _highlightTails = false;
    }



    foreach (QGraphicsItem *it, selectedItems()) it->update();
}

void TikzScene::keyPressEvent(QKeyEvent *event)
{
    //qDebug() << "keypress:" << QString::number(event->key(), 16);
    //qDebug() << "modifiers:" << QString::number(QApplication::queryKeyboardModifiers(), 16);
    bool capture = false;

    // slower, but seems to be more reliable than event->modifiers()
    Qt::KeyboardModifiers mod = QApplication::queryKeyboardModifiers();

    if (mod & Qt::ControlModifier) {
        QSet<Node*> selNodes;
        QSet<Edge*> selEdges;
        getSelection(selNodes, selEdges);

        if (!selNodes.isEmpty()) {
            QPointF delta(0,0);
            qreal shift = (mod & Qt::ShiftModifier) ? 1.0 : 10.0;
            switch(event->key()) {
            case Qt::Key_Left:
                delta.setX(-0.025 * shift);
                break;
            case Qt::Key_Right:
                delta.setX(0.025 * shift);
                break;
            case Qt::Key_Up:
                delta.setY(0.025 * shift);
                break;
            case Qt::Key_Down:
                delta.setY(-0.025 * shift);
                break;
            }

            if (!delta.isNull()) {
                capture = true;
                QMap<Node*,QPointF> oldNodePositions;
                QMap<Node*,QPointF> newNodePositions;
                QPointF pos;

                foreach (QGraphicsItem *gi, selectedItems()) {
                    if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
                        pos = ni->node()->point();
                        oldNodePositions.insert(ni->node(), pos);
                        newNodePositions.insert(ni->node(), pos + delta);
                    }
                }

                MoveCommand *cmd = new MoveCommand(this, oldNodePositions, newNodePositions);
                _tikzDocument->undoStack()->push(cmd);
            }
        } else if (!selEdges.isEmpty()) {
            int deltaAngle = 0;
            qreal deltaWeight = 0.0;

            bool head = !(mod & Qt::ShiftModifier);
            _highlightHeads = head;
            _highlightTails = !head;

            switch(event->key()) {
            case Qt::Key_Left:
                deltaAngle = 15;
                break;
            case Qt::Key_Right:
                deltaAngle = -15;
                break;
            case Qt::Key_Down:
                deltaWeight = -0.1;
                break;
            case Qt::Key_Up:
                deltaWeight = 0.1;
                break;
            }

            if (deltaAngle != 0) {
                capture = true;
                _tikzDocument->undoStack()->beginMacro("Bend edges");

                // shift bend by deltaAngle or -deltaAngle (see below)
                int sign = 1;

                foreach (Edge *e, selEdges) {
                    if (e->basicBendMode()) {
                        _tikzDocument->undoStack()->push(new ChangeEdgeModeCommand(this, e));
                    }

                    if (head) {
                        int oldInAngle = e->inAngle();
                        e->setInAngle(oldInAngle + sign * deltaAngle);
                        EdgeBendCommand *cmd = new EdgeBendCommand(this, e,
                                                                   e->weight(),
                                                                   e->bend(),
                                                                   oldInAngle,
                                                                   e->outAngle());
                        _tikzDocument->undoStack()->push(cmd);
                    } else {
                        int oldOutAngle = e->outAngle();
                        e->setOutAngle(oldOutAngle + sign * deltaAngle);
                        EdgeBendCommand *cmd = new EdgeBendCommand(this, e,
                                                                   e->weight(),
                                                                   e->bend(),
                                                                   e->inAngle(),
                                                                   oldOutAngle);
                        _tikzDocument->undoStack()->push(cmd);
                    }

                    // in the special case where 2 edges are selected, bend in opposite directions
                    if (selEdges.size() == 2) sign *= -1;
                }

                _tikzDocument->undoStack()->endMacro();
            } else if (!almostZero(deltaWeight)) {
                capture = true;
                _tikzDocument->undoStack()->beginMacro("Adjust edges");

                foreach (Edge *e, selEdges) {
                    qreal oldWeight = e->weight();
                    // don't let weight drop below 0.1
                    if (oldWeight + deltaWeight > 0.099) {
                        e->setWeight(oldWeight + deltaWeight);
                        EdgeBendCommand *cmd = new EdgeBendCommand(this, e,
                                                                   oldWeight,
                                                                   e->bend(),
                                                                   e->inAngle(),
                                                                   e->outAngle());
                        _tikzDocument->undoStack()->push(cmd);
                    }
                }

                _tikzDocument->undoStack()->endMacro();
            }
        }
    } else { // no CTRL key
        if (event->key() == Qt::Key_Backspace || event->key() == Qt::Key_Delete) {
            deleteSelectedItems();
        } else if (!event->isAutoRepeat()) {
            switch(event->key()) {
            case Qt::Key_S:
                tikzit->activeWindow()->toolPalette()->setCurrentTool(ToolPalette::SELECT);
                break;
            case Qt::Key_V:
            case Qt::Key_N:
                tikzit->activeWindow()->toolPalette()->setCurrentTool(ToolPalette::VERTEX);
                break;
            case Qt::Key_E:
                tikzit->activeWindow()->toolPalette()->setCurrentTool(ToolPalette::EDGE);
                break;
            }
        }
    }

    foreach (QGraphicsItem *it, selectedItems()) it->update();
    if (!capture) QGraphicsScene::keyPressEvent(event);
}

void TikzScene::mouseDoubleClickEvent(QGraphicsSceneMouseEvent *event)
{
    if (!_enabled) return;

    QPointF mousePos = event->scenePos();

    foreach (QGraphicsItem *it, items(mousePos)) {
        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(it)) {
            if (!ei->edge()->isSelfLoop()) {
                ChangeEdgeModeCommand *cmd = new ChangeEdgeModeCommand(this, ei->edge());
                _tikzDocument->undoStack()->push(cmd);
            }
			break;
        } else if (NodeItem *ni = dynamic_cast<NodeItem*>(it)) {
            QInputDialog *d = new QInputDialog(views()[0]);
            d->setLabelText(tr("Label:"));
            d->setTextValue(ni->node()->label());
            d->setWindowTitle(tr("Node label"));

            if (QLineEdit *le = d->findChild<QLineEdit*>()) {
                le->setValidator(new DelimitedStringValidator(le));
            }

            if (d->exec()) {
                QMap<Node*,QString> oldLabels;
                oldLabels.insert(ni->node(), ni->node()->label());
                ChangeLabelCommand *cmd = new ChangeLabelCommand(this, oldLabels, d->textValue());
                _tikzDocument->undoStack()->push(cmd);
            }

            d->deleteLater();
			break;
        }
    }
}

bool TikzScene::drawNodeLabels() const
{
    return _drawNodeLabels;
}

void TikzScene::setDrawNodeLabels(bool drawNodeLabels)
{
    _drawNodeLabels = drawNodeLabels;
}

bool TikzScene::highlightTails() const
{
    return _highlightTails && getSelectedNodes().isEmpty();
}

bool TikzScene::highlightHeads() const
{
    return _highlightHeads && getSelectedNodes().isEmpty();
}

bool TikzScene::enabled() const
{
    return _enabled;
}

void TikzScene::setEnabled(bool enabled)
{
    _enabled = enabled;
    update();
}

int TikzScene::lineNumberForSelection()
{
    foreach (QGraphicsItem *gi, selectedItems()) {
        if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) return ni->node()->tikzLine();
        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) return ei->edge()->tikzLine();
    }
    return 0;
}


void TikzScene::applyActiveStyleToNodes() {
    ApplyStyleToNodesCommand *cmd = new ApplyStyleToNodesCommand(this, _styles->activeNodeStyleName());
    _tikzDocument->undoStack()->push(cmd);
}

void TikzScene::applyActiveStyleToEdges() {
	ApplyStyleToEdgesCommand *cmd = new ApplyStyleToEdgesCommand(this, _styles->activeEdgeStyleName());
	_tikzDocument->undoStack()->push(cmd);
}

void TikzScene::deleteSelectedItems()
{
    QSet<Node*> selNodes;
    QSet<Edge*> selEdges;
    getSelection(selNodes, selEdges);

    QMap<int,Node*> deleteNodes;
    QMap<int,Edge*> deleteEdges;
    QSet<Path*> deletePaths;

    for (int i = 0; i < _tikzDocument->graph()->nodes().length(); ++i) {
        Node *n = _tikzDocument->graph()->nodes()[i];
        if (selNodes.contains(n)) deleteNodes.insert(i, n);
    }

    for (int i = 0; i < _tikzDocument->graph()->edges().length(); ++i) {
        Edge *e = _tikzDocument->graph()->edges()[i];
        if (selEdges.contains(e) ||
            selNodes.contains(e->source()) ||
            selNodes.contains(e->target()))
        {
            if (e->path()) deletePaths << e->path();
            deleteEdges.insert(i, e);
        }
    }

    //qDebug() << "nodes:" << deleteNodes;
    //qDebug() << "edges:" << deleteEdges;
    _tikzDocument->undoStack()->beginMacro("Delete");
    _tikzDocument->undoStack()->push(new SplitPathCommand(this, deletePaths));
    _tikzDocument->undoStack()->push(new DeleteCommand(this, deleteNodes, deleteEdges,
                                                       selNodes, selEdges));
    _tikzDocument->undoStack()->endMacro();
}

void TikzScene::copyToClipboard()
{
    Graph *g = graph()->copyOfSubgraphWithNodes(getSelectedNodes());
    //qDebug() << g->tikz();
    QGuiApplication::clipboard()->setText(g->tikz());
    delete g;
}

void TikzScene::cutToClipboard()
{
    copyToClipboard();
    deleteSelectedItems();
}


void TikzScene::pasteFromClipboard()
{
    QString tikz = QGuiApplication::clipboard()->text();
    Graph *g = new Graph();
    TikzAssembler ass(g);

    // attempt to parse whatever's on the clipboard, if we get a
    // non-empty tikz graph, insert it.
    if (ass.parse(tikz) && !g->nodes().isEmpty()) {
        // make sure names in the new subgraph are fresh
        g->renameApart(graph());

        QRectF srcRect = g->realBbox();
        QRectF tgtRect = graph()->realBbox();
        QPointF shift(tgtRect.right() - srcRect.left(), 0.0);

        if (shift.x() > 0) {
            foreach (Node *n, g->nodes()) {
                n->setPoint(n->point() + shift);
            }
        }

        PasteCommand *cmd = new PasteCommand(this, g);
        _tikzDocument->undoStack()->push(cmd);
    }
}

void TikzScene::selectAllNodes()
{
    foreach (NodeItem *ni, _nodeItems.values()) {
        ni->setSelected(true);
    }
}

void TikzScene::deselectAll()
{
    foreach (NodeItem *ni, _nodeItems.values()) {
        ni->setSelected(false);
    }

    foreach (EdgeItem *ei, _edgeItems.values()) {
        ei->setSelected(false);
    }
}

bool TikzScene::parseTikz(QString tikz)
{
    Graph *newGraph = new Graph(this);
    TikzAssembler ass(newGraph);
    if (ass.parse(tikz)) {
        ReplaceGraphCommand *cmd = new ReplaceGraphCommand(this, graph(), newGraph);
        tikzDocument()->undoStack()->push(cmd);
        setEnabled(true);
        views()[0]->setFocus();
        return true;
    } else {
        return false;
    }
}

void TikzScene::reflectNodes(bool horizontal)
{
    ReflectNodesCommand *cmd = new ReflectNodesCommand(this, getSelectedNodes(), horizontal);
    tikzDocument()->undoStack()->push(cmd);
}

void TikzScene::rotateNodes(bool clockwise)
{
    RotateNodesCommand *cmd = new RotateNodesCommand(this, getSelectedNodes(), clockwise);
    tikzDocument()->undoStack()->push(cmd);
}


void TikzScene::getSelection(QSet<Node *> &selNodes, QSet<Edge *> &selEdges) const
{
    foreach (QGraphicsItem *gi, selectedItems()) {
        if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) selNodes << ni->node();
        if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) selEdges << ei->edge();
    }
}

QSet<Node *> TikzScene::getSelectedNodes() const
{
    QSet<Node*> selNodes;
    foreach (QGraphicsItem *gi, selectedItems()) {
        if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) selNodes << ni->node();
    }
    return selNodes;
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

void TikzScene::reloadStyles()
{
    _styles->reloadStyles();
	foreach(EdgeItem *ei, _edgeItems) {
		ei->edge()->attachStyle();
		ei->readPos(); // trigger a repaint
	}

    foreach (NodeItem *ni, _nodeItems) {
        ni->node()->attachStyle();
        ni->readPos(); // trigger a repaint
    }
}

void TikzScene::refreshSceneBounds() {
    qreal maxX = 30.0, maxY = 30.0;
    qreal increment = 20.0;

    foreach (Node *n, graph()->nodes()) {
        while (n->point().x() - increment < -maxX || n->point().x() + increment > maxX) {
            maxX += increment;
        }

        while (n->point().y() - increment < -maxY || n->point().y() + increment > maxY) {
            maxY += increment;
        }
    }

    QRectF rect(-GLOBAL_SCALEF * maxX, -GLOBAL_SCALEF * maxY, 2.0 * GLOBAL_SCALEF * maxX, 2.0 * GLOBAL_SCALEF * maxY);

    if (rect != sceneRect()) {
        setSceneRect(rect);
        invalidate();
    }
}

// void TikzScene::refreshSceneBounds()
// {
// //    if (!views().empty()) {
// //        QGraphicsView *v = views().first();
// //        QRectF viewB = v->mapToScene(v->viewport()->rect()).boundingRect();
// //        //QPointF tl = v->mapToScene(viewB.topLeft());
// //        //viewB.setTopLeft(tl);
//
// //        QRectF bounds = viewB.united(rectToScreen(graph()->realBbox().adjusted(-1.0f, -1.0f, 1.0f, 1.0f)));
// //        //qDebug() << viewB;
//
// //        if (bounds != sceneRect()) {
// //            QPointF c = viewB.center();
// //            setSceneRect(bounds);
// //            v->centerOn(c);
// //        }
// //    }
//     //setBounds(graphB);
// }

void TikzScene::refreshAdjacentEdges(QList<Node*> nodes)
{
    if (nodes.empty()) return;

    QSet<Path*> paths;
    foreach (Edge *e, _edgeItems.keys()) {
		EdgeItem *ei = _edgeItems[e];

		// the list "nodes" can be out of date, e.g. if the graph changes while dragging
		if (ei != nullptr) {
			if (nodes.contains(ei->edge()->source()) || nodes.contains(ei->edge()->target())) {
				ei->edge()->updateControls();
				ei->readPos();
			}
		}

        // only update paths once
        Path *p = ei->edge()->path();
        if (p && !paths.contains(p)) {
            pathItems()[p]->readPos();
            paths << p;
        }
    }
}

//void TikzScene::setBounds(QRectF bounds)
//{
//    if (bounds != sceneRect()) {
//        if (!views().empty()) {
//            QGraphicsView *v = views().first();
//            QPointF c = v->mapToScene(v->viewport()->rect().center());
//            setSceneRect(bounds);
//            v->centerOn(c);
//        } else {
//            setSceneRect(bounds);
//        }
//    }
//}

QMap<Node*,NodeItem *> &TikzScene::nodeItems()
{
    return _nodeItems;
}

QMap<Edge*,EdgeItem*> &TikzScene::edgeItems()
{
    return _edgeItems;
}

QMap<Path *, PathItem *> &TikzScene::pathItems()
{
    return _pathItems;
}
