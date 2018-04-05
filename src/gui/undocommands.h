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

class PasteCommand : public GraphUpdateCommand
{
public:
    explicit PasteCommand(TikzScene *scene, Graph *graph, QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    Graph *_graph;
    QList<QGraphicsItem*> _oldSelection;
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

#endif // UNDOCOMMANDS_H
