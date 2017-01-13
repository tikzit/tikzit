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
    ToolPalette();
private:
    QActionGroup *tools;
    QAction *select;
    QAction *vertex;
    QAction *edge;
    QAction *crop;
};

#endif // TOOLPALETTE_H
