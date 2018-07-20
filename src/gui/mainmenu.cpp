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

#include "mainmenu.h"
#include "tikzit.h"

#include <QDebug>

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
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->close();
}

void MainMenu::on_actionSave_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzDocument()->save();
}

void MainMenu::on_actionSave_As_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzDocument()->saveAs();
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
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->cutToClipboard();
}

void MainMenu::on_actionCopy_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->copyToClipboard();
}

void MainMenu::on_actionPaste_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->pasteFromClipboard();
}

void MainMenu::on_actionDelete_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->deleteSelectedItems();
}

void MainMenu::on_actionSelect_All_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->selectAllNodes();
}

void MainMenu::on_actionDeselect_All_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->deselectAll();
}


// Tikz
void MainMenu::on_actionParse_triggered()
{
    MainWindow *win = tikzit->activeWindow();
    if (win != 0) {
        win->tikzScene()->parseTikz(win->tikzSource());
    }
}

void MainMenu::on_actionRevert_triggered()
{
    MainWindow *win = tikzit->activeWindow();
    if (win != 0) {
        win->tikzDocument()->refreshTikz();
        win->tikzScene()->setEnabled(true);
    }
}

void MainMenu::on_actionJump_to_Selection_triggered()
{
    MainWindow *win = tikzit->activeWindow();
    if (win != 0) {
        qDebug() << "jump to selection on line:" << win->tikzScene()->lineNumberForSelection();
        win->setSourceLine(win->tikzScene()->lineNumberForSelection());
    }
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
