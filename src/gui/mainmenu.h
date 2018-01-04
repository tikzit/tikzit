#ifndef MAINMENU_H
#define MAINMENU_H

#include "ui_mainmenu.h"

#include <QMenuBar>

class MainMenu : public QMenuBar
{
    Q_OBJECT
public:
    MainMenu();

private:
    Ui::MainMenu ui;

public slots:
    // File
    void on_actionNew_triggered();
    void on_actionOpen_triggered();
    void on_actionClose_triggered();
    void on_actionSave_triggered();
    void on_actionSave_As_triggered();

    // Edit
    void on_actionUndo_triggered();
    void on_actionRedo_triggered();
    void on_actionCut_triggered();
    void on_actionCopy_triggered();
    void on_actionPaste_triggered();
    void on_actionDelete_triggered();
    void on_actionSelect_All_triggered();
    void on_actionDeselect_All_triggered();

    // Tikz
    void on_actionParse_triggered();

    // View
    void on_actionZoom_In_triggered();
    void on_actionZoom_Out_triggered();
};

#endif // MAINMENU_H
