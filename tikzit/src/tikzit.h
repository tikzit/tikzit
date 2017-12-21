/**
  * Tikzit is the top-level class which maintains the global application state. For convenience,
  * it also inherits the main menu.
  */

#ifndef TIKZIT_H
#define TIKZIT_H

#include "mainwindow.h"
#include "mainmenu.h"
#include "ui_mainmenu.h"

#include "toolpalette.h"
#include "propertypalette.h"
#include "nodestyle.h"

#include <QObject>
#include <QVector>
#include <QPointF>
#include <QMenuBar>
#include <QMainWindow>
#include <QFont>

// Number of pixels between (0,0) and (1,0) at 100% zoom level. This should be
// divisible by 8 to avoid rounding errors with e.g. grid-snapping.
#define GLOBAL_SCALE 80
#define GLOBAL_SCALEF 80.0f

inline QPointF toScreen(QPointF src)
{ src.setY(-src.y()); src *= GLOBAL_SCALEF; return src; }

inline QPointF fromScreen(QPointF src)
{ src.setY(-src.y()); src /= GLOBAL_SCALEF; return src; }


class Tikzit : public QObject {
    Q_OBJECT
public:
    Tikzit();
    ToolPalette *toolPalette() const;
    PropertyPalette *propertyPalette() const;

    MainWindow *activeWindow() const;
    void setActiveWindow(MainWindow *activeWindow);
    void removeWindow(MainWindow *w);
    NodeStyle nodeStyle(QString name);

    static QFont LABEL_FONT;
//    Ui::MainMenu *_mainMenuUi;
//    QMenuBar *_mainMenu;

    void newDoc();
    void open();

private:
//    void createMenu();
    void loadStyles();

    MainMenu *_mainMenu;
    ToolPalette *_toolPalette;
    PropertyPalette *_propertyPalette;
    QVector<MainWindow*> _windows;
    MainWindow *_activeWindow;
    QVector<NodeStyle> _nodeStyles;

};

extern Tikzit *tikzit;

#endif // TIKZIT_H
