/**
  * These classes store the data required to undo/redo a single UI action.
  */

#ifndef UNDOCOMMANDS_H
#define UNDOCOMMANDS_H

#include "tikzscene.h"

#include <QUndoCommand>

class MoveCommand : public QUndoCommand
{
public:
    explicit MoveCommand(TikzScene *scene, QUndoCommand *parent = 0);
    void undo() override;
    void redo() override;
private:
    TikzScene *_scene;
};

#endif // UNDOCOMMANDS_H
