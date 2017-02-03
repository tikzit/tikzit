#ifndef TIKZVIEW_H
#define TIKZVIEW_H

#include <QObject>
#include <QWidget>
#include <QGraphicsView>
#include <QPainter>
#include <QGraphicsItem>
#include <QStyleOptionGraphicsItem>
#include <QRectF>

class TikzView : public QGraphicsView
{
    Q_OBJECT
public:
    explicit TikzView(QWidget *parent = 0);
public slots:
    void zoomIn();
    void zoomOut();
};

#endif // TIKZVIEW_H
