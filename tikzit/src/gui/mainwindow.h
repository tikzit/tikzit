#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "tikzscene.h"

#include <QMainWindow>
#include <QGraphicsView>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();
private:
    TikzScene *tikzScene;
    Ui::MainWindow *ui;
};

#endif // MAINWINDOW_H
