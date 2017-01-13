#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "tikzscene.h"

#include <QMainWindow>
#include <QGraphicsView>

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = 0);
    ~MainWindow();
private:
    TikzScene *tikzScene;
    QGraphicsView *tikzView;
};

#endif // MAINWINDOW_H
