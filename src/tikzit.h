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


/*!
 *
 * \mainpage TikZiT Documentation
 *
 * This is the source code documentation for TikZiT. The global entry point
 * for the TikZiT executable is in main.cpp, whereas the class Tikzit maintains
 * the global application state.
 *
 * The TikZ parser is implemented in flex/bison in the files tikzlexer.l and tikzparser.y.
 *
 * Most of the interesting code for handling user input is in the class TikzScene. Anything
 * that makes a change to the tikz file should be implemented as a QUndoCommand. Currently,
 * these are all in undocommands.h.
 *
 * I've basically been adding documentation as I go. Other bits and pieces can be accessed
 * by searching, or via the class list/class hierarchy links in the menu above.
 *
 */

/*!
 *
 * \class Tikzit
 *
 * Tikzit is the top-level class which maintains the global application state. For convenience,
 * it also holds an instance of the main menu for macOS (or Ubuntu unity) style GUIs which only
 * have one, application-level menu.
 *
 */

#ifndef TIKZIT_H
#define TIKZIT_H

#define TIKZIT_VERSION "2.0.0"

#include "mainwindow.h"
#include "mainmenu.h"
#include "ui_mainmenu.h"

#include "styleeditor.h"
#include "toolpalette.h"
#include "propertypalette.h"
#include "stylepalette.h"
#include "tikzstyles.h"
#include "latexprocess.h"
#include "previewwindow.h"

#include <QObject>
#include <QVector>
#include <QStringList>
#include <QPointF>
#include <QMenuBar>
#include <QMainWindow>
#include <QFont>
#include <QColor>
#include <QNetworkReply>

// Number of pixels between (0,0) and (1,0) at 100% zoom level. This should be
// divisible by 8 to avoid rounding errors with e.g. grid-snapping.
#define GLOBAL_SCALE 40
#define GLOBAL_SCALEF 40.0f
#define GLOBAL_SCALEF_INV 0.025f
#define GRID_N 4
#define GRID_SEP 10
#define GRID_SEPF 10.0f


inline QPointF toScreen(QPointF src)
{ src.setY(-src.y()); src *= GLOBAL_SCALEF; return src; }

inline QPointF fromScreen(QPointF src)
{ src.setY(-src.y()); src *= GLOBAL_SCALEF_INV; return src; }

inline QRectF rectToScreen(QRectF src)
{ return QRectF(src.x()                 * GLOBAL_SCALEF,
                -(src.y()+src.height()) * GLOBAL_SCALEF,
                src.width()             * GLOBAL_SCALEF,
                src.height()            * GLOBAL_SCALEF); }

inline QRectF rectFromScreen(QRectF src)
{ return QRectF(src.x()                 * GLOBAL_SCALEF_INV,
                -(src.y()+src.height()) * GLOBAL_SCALEF_INV,
                src.width()             * GLOBAL_SCALEF_INV,
                src.height()            * GLOBAL_SCALEF_INV); }

class Tikzit : public QObject {
    Q_OBJECT
public:
    Tikzit();
    ToolPalette *toolPalette() const;
    PropertyPalette *propertyPalette() const;

    MainWindow *activeWindow() const;
    void setActiveWindow(MainWindow *activeWindow);
    void removeWindow(MainWindow *w);

    static QFont LABEL_FONT;

    void newDoc();
    void open();
	void open(QString fileName);
    void quit();
    void init();

    // convenience functions for named colors
    QColor colorByIndex(int i);
    QColor colorByName(QString name);
    QString nameForColor(QColor col);

    void newTikzStyles();
    void openTikzStyles();
    bool loadStyles(QString fileName);
    void showStyleEditor();
    TikzStyles *styles() const;
    QString styleFile() const;
    //StylePalette *stylePalette() const;

    QString styleFilePath() const;

public slots:
    void setCheckForUpdates(bool check);
    void checkForUpdates(bool manual);
    void updateAuto(QNetworkReply *reply);
    void updateManual(QNetworkReply *reply);
    void updateReply(QNetworkReply *reply, bool manual);
    void makePreview();
    void cleanupLatex();

private:
    //    void createMenu();

    MainMenu *_mainMenu;
    ToolPalette *_toolPalette;
    PropertyPalette *_propertyPalette;
    //StylePalette *_stylePalette;
    TikzStyles *_styles;
    QString _styleFile;
    QString _styleFilePath;
    QVector<MainWindow*> _windows;
    MainWindow *_activeWindow;
    StyleEditor *_styleEditor;
    QStringList _colNames;
    QVector<QColor> _cols;
    LatexProcess *_latex;
    PreviewWindow *_preview;
};

extern Tikzit *tikzit;

#endif // TIKZIT_H
