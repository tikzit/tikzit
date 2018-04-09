/*!
  * A top-level window, which contains a single TikzDocument.
  */

#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "tikzscene.h"
#include "tikzview.h"
#include "graph.h"
#include "tikzdocument.h"
#include "mainmenu.h"
#include "toolpalette.h"
#include "stylepalette.h"

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
    int windowId() const;
    TikzView *tikzView() const;
    TikzScene *tikzScene() const;
    TikzDocument *tikzDocument() const;
    ToolPalette *toolPalette() const;    
    StylePalette *stylePalette() const;
    QString tikzSource();
    void setSourceLine(int line);

public slots:
    void on_tikzSource_textChanged();
    void updateFileName();
    void refreshTikz();
protected:
    void closeEvent(QCloseEvent *event);
    void changeEvent(QEvent *event);

private:
    TikzScene *_tikzScene;
    TikzDocument *_tikzDocument;
    MainMenu *_menu;
    ToolPalette *_toolPalette;
    StylePalette *_stylePalette;
    Ui::MainWindow *ui;
    int _windowId;
    static int _numWindows;
};

#endif // MAINWINDOW_H
