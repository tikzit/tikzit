/*!
  * This class contains a tikz Graph, source code, file info, and undo stack.  It serves as the model
  * in the MVC triple (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZDOCUMENT_H
#define TIKZDOCUMENT_H

#include "graph.h"

#include <QObject>
#include <QUndoStack>

class TikzDocument : public QObject
{
    Q_OBJECT
public:
    explicit TikzDocument(QObject *parent = 0);
    ~TikzDocument();

    Graph *graph() const;
    void setGraph(Graph *graph);
    QString tikz() const;
    QUndoStack *undoStack() const;
    bool parseSuccess() const;
    void refreshTikz();

    void open(QString fileName);

    QString shortName() const;

    void saveAs();
    void save();

private:
    Graph *_graph;
    QString _tikz;
    QString _fileName;
    QString _shortName;
    QUndoStack *_undoStack;
    bool _parseSuccess;

signals:

public slots:
};

#endif // TIKZDOCUMENT_H
