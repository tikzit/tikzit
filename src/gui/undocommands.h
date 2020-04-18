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
  * \file undocommands.h
  *
  * All changes to a TikzDocument are done via subclasses of QUndoCommand. When a controller
  * (e.g. TikzScene) gets input from the user to change the document, it will push one of
  * these commands onto the TikzDocument's undo stack, which automatically calls the redo()
  * method of the command.
  */

#ifndef UNDOCOMMANDS_H
#define UNDOCOMMANDS_H

#include "tikzscene.h"

#include <QUndoCommand>
#include <QSet>

class GraphUpdateCommand : public QUndoCommand {
public:
    explicit GraphUpdateCommand(TikzScene *scene,
                                QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
protected:
    TikzScene *_scene;
};

class MoveCommand : public GraphUpdateCommand
{
public:
    explicit MoveCommand(TikzScene *scene,
                         QMap<Node*,QPointF> oldNodePositions,
                         QMap<Node*,QPointF> newNodePositions,
                         QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QMap<Node*,QPointF> _oldNodePositions;
    QMap<Node*,QPointF> _newNodePositions;
};

class EdgeBendCommand : public GraphUpdateCommand
{
public:
    explicit EdgeBendCommand(TikzScene *scene, Edge *edge,
                             qreal oldWeight, int oldBend,
                             int oldInAngle, int oldOutAngle,
                             QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
    qreal _oldWeight;
    int _oldBend;
    int _oldInAngle;
    int _oldOutAngle;
    qreal _newWeight;
    int _newBend;
    int _newInAngle;
    int _newOutAngle;
};

class ReverseEdgesCommand : public GraphUpdateCommand
{
public:
    explicit ReverseEdgesCommand(TikzScene *scene, QSet<Edge*> edgeSet,
                                 QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QSet<Edge*> _edgeSet;
};

class DeleteCommand : public GraphUpdateCommand
{
public:
    explicit DeleteCommand(TikzScene *scene,
                           QMap<int,Node*> deleteNodes,
                           QMap<int,Edge*> deleteEdges,
                           QSet<Node*> selNodes,
                           QSet<Edge*> selEdges,
                           QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QMap<int,Node*> _deleteNodes;
    QMap<int,Edge*> _deleteEdges;
    QSet<Node*> _selNodes;
    QSet<Edge*> _selEdges;
};

class AddNodeCommand : public GraphUpdateCommand
{
public:
    explicit AddNodeCommand(TikzScene *scene, Node *node, QRectF newBounds,
                            QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Node *_node;
    QRectF _oldBounds;
    QRectF _newBounds;
};

class AddEdgeCommand : public GraphUpdateCommand
{
public:
    explicit AddEdgeCommand(TikzScene *scene, Edge *edge,
                            bool selectEdge=false,
                            QSet<Node *> selNodes=QSet<Node*>(),
                            QSet<Edge *> selEdges=QSet<Edge*>(),
                            QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
    bool _selectEdge;
    QSet<Node*> _selNodes;
    QSet<Edge*> _selEdges;
};

class ChangeEdgeModeCommand : public GraphUpdateCommand
{
public:
    explicit ChangeEdgeModeCommand(TikzScene *scene, Edge *edge, QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
};

class ApplyStyleToNodesCommand : public GraphUpdateCommand
{
public:
    explicit ApplyStyleToNodesCommand(TikzScene *scene, QString style, QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QString _style;
    QMap<Node*,QString> _oldStyles;
};

class ApplyStyleToEdgesCommand : public GraphUpdateCommand
{
public:
	explicit ApplyStyleToEdgesCommand(TikzScene *scene, QString style, QUndoCommand *parent = nullptr);
	void undo() override;
	void redo() override;
private:
	QString _style;
	QMap<Edge*, QString> _oldStyles;
};

class PasteCommand : public GraphUpdateCommand
{
public:
    explicit PasteCommand(TikzScene *scene, Graph *graph, QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Graph *_graph;
    QSet<Node*> _oldSelectedNodes;
	QSet<Edge*> _oldSelectedEdges;
};

class ChangeLabelCommand : public GraphUpdateCommand
{
public:
    explicit ChangeLabelCommand(TikzScene *scene,
                                QMap<Node*,QString> oldLabels,
                                QString newLabel,
                                QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QMap<Node*,QString> _oldLabels;
    QString _newLabel;
};

class ReplaceGraphCommand : public GraphUpdateCommand
{
public:
    explicit ReplaceGraphCommand(TikzScene *scene,
                                 Graph *oldGraph,
                                 Graph *newGraph,
                                 QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    Graph *_oldGraph;
    Graph *_newGraph;
};

class ReflectNodesCommand : public GraphUpdateCommand
{
public:
    explicit ReflectNodesCommand(TikzScene *scene,
                                 QSet<Node*> nodes,
                                 bool horizontal,
                                 QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QSet<Node*> _nodes;
    bool _horizontal;
};

class RotateNodesCommand : public GraphUpdateCommand
{
public:
    explicit RotateNodesCommand(TikzScene *scene,
                                QSet<Node*> nodes,
                                bool clockwise,
                                QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QSet<Node*> _nodes;
    bool _clockwise;
};

class ReorderCommand : public GraphUpdateCommand
{
public:
    explicit ReorderCommand(TikzScene *scene,
                            const QVector<Node*> &oldNodeOrder,
                            const QVector<Node*> &newNodeOrder,
                            const QVector<Edge*> &oldEdgeOrder,
                            const QVector<Edge*> &newEdgeOrder,
                            QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QVector<Node*> _oldNodeOrder;
    QVector<Node*> _newNodeOrder;
    QVector<Edge*> _oldEdgeOrder;
    QVector<Edge*> _newEdgeOrder;
};

class MakePathCommand : public GraphUpdateCommand
{
public:
    explicit MakePathCommand(TikzScene *scene,
                             const QVector<Edge*> &edgeList,
                             const QMap<Edge*,GraphElementData*> &oldEdgeData,
                             QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QVector<Edge*> _edgeList;

    // creating path clobbers data on all but first edge
    QMap<Edge*,GraphElementData*> _oldEdgeData;
};

class SplitPathCommand : public GraphUpdateCommand
{
public:
    explicit SplitPathCommand(TikzScene *scene,
                              const QSet<Path*> &paths,
                              QUndoCommand *parent = nullptr);
    void undo() override;
    void redo() override;
private:
    QSet<Path*> _paths;

    // keep a copy of the edge lists so they can be added back to each path in undo()
    QMap<Path*,QVector<Edge*>> _edgeLists;
};

#endif // UNDOCOMMANDS_H
