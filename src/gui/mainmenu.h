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

#ifndef MAINMENU_H
#define MAINMENU_H

#include "ui_mainmenu.h"

#include <QMenuBar>

class MainMenu : public QMenuBar
{
    Q_OBJECT
public:
    MainMenu();
    void addDocks(QMenu *m);
    QAction *updatesAction();
    void updateRecentFiles();

private:
    Ui::MainMenu ui;

public slots:
    // File
    void on_actionNew_triggered();
    void on_actionOpen_triggered();
    void on_actionClose_triggered();
    void on_actionSave_triggered();
    void on_actionSave_As_triggered();
    void on_actionExit_triggered();

    void openRecent();

    // Edit
    void on_actionUndo_triggered();
    void on_actionRedo_triggered();
    void on_actionCut_triggered();
    void on_actionCopy_triggered();
    void on_actionPaste_triggered();
    void on_actionDelete_triggered();
    void on_actionSelect_All_triggered();
    void on_actionDeselect_All_triggered();
    void on_actionReflectHorizontal_triggered();
    void on_actionReflectVertical_triggered();
    void on_actionRotateCW_triggered();
    void on_actionRotateCCW_triggered();
    void on_actionBring_to_Front_triggered();
    void on_actionSend_to_Back_triggered();
    void on_actionExtendUp_triggered();
    void on_actionExtendDown_triggered();
    void on_actionExtendLeft_triggered();
    void on_actionExtendRight_triggered();
    void on_actionReverse_Edge_Direction_triggered();
    void on_actionMerge_Nodes_triggered();
    void on_actionMake_Path_triggered();
    void on_actionMake_Path_as_Background_triggered();
    void on_actionSplit_Path_triggered();

    // Tools
    void on_actionParse_triggered();
    void on_actionRevert_triggered();
    void on_actionJump_to_Selection_triggered();
    void on_actionRun_LaTeX_triggered();
    void on_actionPrevious_Node_Style_triggered();
    void on_actionNext_Node_Style_triggered();
    void on_actionClear_Node_Style_triggered();
    void on_actionPrevious_Edge_Style_triggered();
    void on_actionNext_Edge_Style_triggered();
    void on_actionClear_Edge_Style_triggered();
    void on_actionPreferences_triggered();

    // View
    void on_actionZoom_In_triggered();
    void on_actionZoom_Out_triggered();
    void on_actionShow_Node_Labels_triggered();

    // Help
    void on_actionAbout_triggered();
    void on_actionCheck_for_updates_automatically_triggered();
    void on_actionCheck_now_triggered();
};

#endif // MAINMENU_H
