#include "mainmenu.h"
#include "tikzit.h"

MainMenu::MainMenu()
{
    ui.setupUi(this);
}

// File
void MainMenu::on_actionNew_triggered()
{
    tikzit->newDoc();
}

void MainMenu::on_actionOpen_triggered()
{
    tikzit->open();
}

void MainMenu::on_actionClose_triggered()
{
    // TODO
}

void MainMenu::on_actionSave_triggered()
{
    // TODO
}

void MainMenu::on_actionSave_As_triggered()
{
    // TODO
}

void MainMenu::on_actionExit_triggered()
{
    tikzit->quit();
}


// Edit
void MainMenu::on_actionUndo_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzDocument()->undoStack()->undo();
}

void MainMenu::on_actionRedo_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzDocument()->undoStack()->redo();
}

void MainMenu::on_actionCut_triggered()
{
    // TODO
}

void MainMenu::on_actionCopy_triggered()
{
    // TODO
}

void MainMenu::on_actionPaste_triggered()
{
    // TODO
}

void MainMenu::on_actionDelete_triggered()
{
    // TODO
}

void MainMenu::on_actionSelect_All_triggered()
{
    // TODO
}

void MainMenu::on_actionDeselect_All_triggered()
{
    // TODO
}


// Tikz
void MainMenu::on_actionParse_triggered()
{
    // TODO
}


// View
void MainMenu::on_actionZoom_In_triggered()
{
    if (tikzit->activeWindow() != 0) tikzit->activeWindow()->tikzView()->zoomIn();
}

void MainMenu::on_actionZoom_Out_triggered()
{
    if (tikzit->activeWindow() != 0) tikzit->activeWindow()->tikzView()->zoomOut();
}
