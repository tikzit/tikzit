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
#include <QSettings>
#include <QMessageBox>

MainMenu::MainMenu()
{
    QSettings settings("tikzit", "tikzit");
    ui.setupUi(this);

    if (!settings.value("check-for-updates").isNull()) {
        ui.actionCheck_for_updates_automatically->blockSignals(true);
        ui.actionCheck_for_updates_automatically->setChecked(settings.value("check-for-updates").toBool());
        ui.actionCheck_for_updates_automatically->blockSignals(false);
    }

    updateRecentFiles();
}

void MainMenu::addDocks(QMenu *m)
{
    ui.menuView->addSeparator();
    foreach (QAction *a, m->actions()) {
        if (!a->isSeparator()) ui.menuView->addAction(a);
    }
}

QAction *MainMenu::updatesAction()
{
    return ui.actionCheck_for_updates_automatically;
}

void MainMenu::updateRecentFiles()
{
    QSettings settings("tikzit", "tikzit");
    ui.menuOpen_Recent->clear();

    QStringList recentFiles = settings.value("recent-files").toStringList();
    //qDebug() << "update:" << recentFiles;

    QAction *action;
    foreach (QString f, recentFiles) {
        QFileInfo fi(f);
        action = new QAction(fi.fileName(), ui.menuOpen_Recent);
        action->setData(f);
        ui.menuOpen_Recent->addAction(action);
        connect(action, SIGNAL(triggered()),
                this, SLOT(openRecent()));
    }

    ui.menuOpen_Recent->addSeparator();
    action = new QAction("Clear List", ui.menuOpen_Recent);
    connect(action, SIGNAL(triggered()),
            tikzit, SLOT(clearRecentFiles()));
    ui.menuOpen_Recent->addAction(action);
    ui.menuOpen_Recent->repaint();
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

void MainMenu::openRecent()
{
    if (sender() != nullptr) {
        if (QAction *action = dynamic_cast<QAction*>(sender())) {
            tikzit->open(action->data().toString());
        }
    }
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

void MainMenu::on_actionReflectHorizontal_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->reflectNodes(true);
}

void MainMenu::on_actionReflectVertical_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->reflectNodes(false);
}

void MainMenu::on_actionRotateCW_triggered() {
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->rotateNodes(true);
}

void MainMenu::on_actionRotateCCW_triggered() {
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->rotateNodes(false);
}

void MainMenu::on_actionBring_to_Front_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->reorderSelection(true);
}

void MainMenu::on_actionSend_to_Back_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->reorderSelection(false);
}

void MainMenu::on_actionExtendUp_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->extendSelectionUp();
}

void MainMenu::on_actionExtendDown_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->extendSelectionDown();
}

void MainMenu::on_actionExtendLeft_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->extendSelectionLeft();
}

void MainMenu::on_actionExtendRight_triggered()
{
    if (tikzit->activeWindow() != 0)
        tikzit->activeWindow()->tikzScene()->extendSelectionRight();
}


// Tikz
void MainMenu::on_actionParse_triggered()
{
    MainWindow *win = tikzit->activeWindow();
    if (win != 0) {
        if (win->tikzScene()->parseTikz(win->tikzSource())) {
            QList<int> sz = win->splitter()->sizes();
            sz[0] = sz[0] + sz[1];
            sz[1] = 0;
            win->splitter()->setSizes(sz);
        }
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
        //qDebug() << "jump to selection on line:" << win->tikzScene()->lineNumberForSelection();
        QList<int> sz = win->splitter()->sizes();
        if (sz[1] == 0) {
            sz[1] = 200;
            win->splitter()->setSizes(sz);
        }
        win->setSourceLine(win->tikzScene()->lineNumberForSelection());
    }
}

void MainMenu::on_actionRun_LaTeX_triggered()
{
    tikzit->makePreview();
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

void MainMenu::on_actionAbout_triggered()
{
    QMessageBox::about(this,
                       "TikZiT",
                       "<h2><b>TikZiT</b></h2>"
                       "<p><i>version " TIKZIT_VERSION "</i></p>"
                       "<p>TikZiT is a GUI diagram editor for PGF/TikZ. It is licensed under the "
                       "<a href=\"https://www.gnu.org/licenses/gpl-3.0.en.html\">GNU General "
                       "Public License, version 3.0</a>.</p>"
                       "<p>For more info and updates, visit: "
                       "<a href=\"https://tikzit.github.io\">tikzit.github.io</a></p>");
}

void MainMenu::on_actionCheck_for_updates_automatically_triggered()
{
    tikzit->setCheckForUpdates(ui.actionCheck_for_updates_automatically->isChecked());
}

void MainMenu::on_actionCheck_now_triggered()
{
    tikzit->checkForUpdates(true);
}
