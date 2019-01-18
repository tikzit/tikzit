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

/*!
  * Manage the scene, which contains a single Graph, and respond to user input. This serves as
  * the controller for the MVC (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include "graph.h"
#include "nodeitem.h"
#include "edgeitem.h"
#include "tikzdocument.h"
#include "toolpalette.h"
#include "stylepalette.h"

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
   TikzScene(TikzDocument *tikzDocument, ToolPalette *tools, StylePalette *styles, QObject *parent);
    ~TikzScene() override;
    Graph *graph();
    QMap<Node*,NodeItem*> &nodeItems();
    QMap<Edge*,EdgeItem*> &edgeItems();
    void refreshAdjacentEdges(QList<Node*> nodes);
//    void setBounds(QRectF bounds);

    TikzDocument *tikzDocument() const;
    void setTikzDocument(TikzDocument *tikzDocument);
    void reloadStyles();
    //void refreshSceneBounds();
    void applyActiveStyleToNodes();
	void applyActiveStyleToEdges();
    void deleteSelectedItems();
    void copyToClipboard();
    void cutToClipboard();
    void pasteFromClipboard();
    void selectAllNodes();
    void deselectAll();
    bool parseTikz(QString tikz);
    void reflectNodes(bool horizontal);
    void rotateNodes(bool clockwise);
    bool enabled() const;
    void setEnabled(bool enabled);
    int lineNumberForSelection();

    void extendSelectionUp();
    void extendSelectionDown();
    void extendSelectionLeft();
    void extendSelectionRight();

    void reorderSelection(bool toFront);

    void reverseSelectedEdges();


    void getSelection(QSet<Node*> &selNodes, QSet<Edge*> &selEdges) const;
    QSet<Node*> getSelectedNodes() const;

    void refreshSceneBounds();

    bool highlightHeads() const;

    bool highlightTails() const;

public slots:
    void graphReplaced();
    void refreshZIndices();

protected:
    void mousePressEvent(QGraphicsSceneMouseEvent *event) override;
    void mouseMoveEvent(QGraphicsSceneMouseEvent *event) override;
    void mouseReleaseEvent(QGraphicsSceneMouseEvent *event) override;
    void keyReleaseEvent(QKeyEvent *event) override;
    void keyPressEvent(QKeyEvent *event) override;
    void mouseDoubleClickEvent(QGraphicsSceneMouseEvent *event) override;
private:
    TikzDocument *_tikzDocument;
    ToolPalette *_tools;
    StylePalette *_styles;
    QMap<Node*,NodeItem*> _nodeItems;
    QMap<Edge*,EdgeItem*> _edgeItems;
    QGraphicsLineItem *_drawEdgeItem;
    QGraphicsRectItem *_rubberBandItem;
    EdgeItem *_modifyEdgeItem;
    NodeItem *_edgeStartNodeItem;
    NodeItem *_edgeEndNodeItem;
    bool _firstControlPoint;
    QPointF _mouseDownPos;
    bool _draggingNodes;

    QMap<Node*,QPointF> _oldNodePositions;
    qreal _oldWeight;
    int _oldBend;
    int _oldInAngle;
    int _oldOutAngle;
    bool _enabled;

    bool _highlightHeads;
    bool _highlightTails;
    bool _smartTool;
};

#endif // TIKZSCENE_H
