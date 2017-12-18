#ifndef TIKZIT_H
#define TIKZIT_H

#include "mainwindow.h"
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

// interpolate on a cubic bezier curve
inline float bezierInterpolate(float dist, float c0, float c1, float c2, float c3) {
    float distp = 1 - dist;
    return	(distp*distp*distp) * c0 +
            3 * (distp*distp) * dist * c1 +
            3 * (dist*dist) * distp * c2 +
            (dist*dist*dist) * c3;
}

inline QPointF bezierInterpolateFull (float dist, QPointF c0, QPointF c1, QPointF c2, QPointF c3) {
    return QPointF(bezierInterpolate (dist, c0.x(), c1.x(), c2.x(), c3.x()),
                   bezierInterpolate (dist, c0.y(), c1.y(), c2.y(), c3.y()));
}

class Tikzit : public QObject {
    Q_OBJECT
public:
    Tikzit();
    QMenuBar *mainMenu() const;
    ToolPalette *toolPalette() const;
    PropertyPalette *propertyPalette() const;

    MainWindow *activeWindow() const;
    void setActiveWindow(MainWindow *activeWindow);
    void removeWindow(MainWindow *w);
    NodeStyle nodeStyle(QString name);

    static QFont LABEL_FONT;

private:
    void createMenu();
    void loadStyles();

    QMenuBar *_mainMenu;
    ToolPalette *_toolPalette;
    PropertyPalette *_propertyPalette;
    QVector<MainWindow*> _windows;
    MainWindow *_activeWindow;
    QVector<NodeStyle> _nodeStyles;

public slots:
    void newDoc();
    void open();
    void zoomIn();
    void zoomOut();
};

extern Tikzit *tikzit;

#endif // TIKZIT_H
