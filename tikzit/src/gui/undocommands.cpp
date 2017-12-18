#include "undocommands.h"

MoveCommand::MoveCommand(TikzScene *scene, QUndoCommand *parent) : QUndoCommand(parent)
{
    _scene = scene;
}

void MoveCommand::undo()
{

}

void MoveCommand::redo()
{

}
