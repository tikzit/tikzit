#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "tikzscene.h"
#include "graph.h"

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

    void open(QString fileName);

protected:
    void closeEvent(QCloseEvent *event);
private:
    TikzScene *tikzScene;
    Ui::MainWindow *ui;
    Graph *_graph;
    QString _fileName;
    bool _pristine;
    static int _numWindows;
public slots:
    void on_actionOpen_triggered();
};

#endif // MAINWINDOW_H
