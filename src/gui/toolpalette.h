/*!
  * A small window that lets the user select the current editing tool.
  */

#ifndef TOOLPALETTE_H
#define TOOLPALETTE_H

#include <QObject>
#include <QToolBar>
#include <QAction>
#include <QActionGroup>

class ToolPalette : public QToolBar
{
    Q_OBJECT
public:
    ToolPalette(QWidget *parent = 0);
    enum Tool {
        SELECT,
        VERTEX,
        EDGE,
        CROP
    };

    Tool currentTool() const;
    void setCurrentTool(Tool tool);
private:
    QActionGroup *tools;
    QAction *select;
    QAction *vertex;
    QAction *edge;
    QAction *crop;
};

#endif // TOOLPALETTE_H
