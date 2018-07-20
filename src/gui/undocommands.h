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
                                QUndoCommand *parent = 0);
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
                         QUndoCommand *parent = 0);
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
                             float oldWeight, int oldBend,
                             int oldInAngle, int oldOutAngle,
                             QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
    float _oldWeight;
    int _oldBend;
    int _oldInAngle;
    int _oldOutAngle;
    float _newWeight;
    int _newBend;
    int _newInAngle;
    int _newOutAngle;
};

class DeleteCommand : public GraphUpdateCommand
{
public:
    explicit DeleteCommand(TikzScene *scene,
                           QMap<int,Node*> deleteNodes,
                           QMap<int,Edge*> deleteEdges,
                           QSet<Edge*> selEdges,
                           QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    QMap<int,Node*> _deleteNodes;
    QMap<int,Edge*> _deleteEdges;
    QSet<Edge*> _selEdges;
};

class AddNodeCommand : public GraphUpdateCommand
{
public:
    explicit AddNodeCommand(TikzScene *scene, Node *node, QRectF newBounds,
                            QUndoCommand *parent = 0);
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
    explicit AddEdgeCommand(TikzScene *scene, Edge *edge, QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
};

class ChangeEdgeModeCommand : public GraphUpdateCommand
{
public:
    explicit ChangeEdgeModeCommand(TikzScene *scene, Edge *edge, QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    Edge *_edge;
};

class ApplyStyleToNodesCommand : public GraphUpdateCommand
{
public:
    explicit ApplyStyleToNodesCommand(TikzScene *scene, QString style, QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    QString _style;
    QMap<Node*,QString> _oldStyles;
};

class ApplyStyleToEdgesCommand : public GraphUpdateCommand
{
public:
	explicit ApplyStyleToEdgesCommand(TikzScene *scene, QString style, QUndoCommand *parent = 0);
	void undo() override;
	void redo() override;
private:
	QString _style;
	QMap<Edge*, QString> _oldStyles;
};

class PasteCommand : public GraphUpdateCommand
{
public:
    explicit PasteCommand(TikzScene *scene, Graph *graph, QUndoCommand *parent = 0);
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
                                Graph *graph,
                                QMap<Node*,QString> oldLabels,
                                QString newLabel,
                                QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    Graph *_graph;
    QMap<Node*,QString> _oldLabels;
    QString _newLabel;
};

class ReplaceGraphCommand : public GraphUpdateCommand
{
public:
    explicit ReplaceGraphCommand(TikzScene *scene,
                                 Graph *oldGraph,
                                 Graph *newGraph,
                                 QUndoCommand *parent = 0);
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
                                 QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    QSet<Node*> _nodes;
    bool _horizontal;
};

#endif // UNDOCOMMANDS_H
