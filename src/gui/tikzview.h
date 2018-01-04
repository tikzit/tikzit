/**
  * Display a Graph, and manage any user input that purely changes the view (e.g. Zoom). This
  * serves as the view in the MVC (TikzDocument, TikzView, TikzScene).
  */

#ifndef TIKZVIEW_H
#define TIKZVIEW_H

#include <QObject>
#include <QWidget>
#include <QGraphicsView>
#include <QPainter>
#include <QGraphicsItem>
#include <QStyleOptionGraphicsItem>
#include <QRectF>
#include <QMouseEvent>

class TikzView : public QGraphicsView
{
    Q_OBJECT
public:
    explicit TikzView(QWidget *parent = 0);
public slots:
    void zoomIn();
    void zoomOut();
protected:
    void drawBackground(QPainter *painter, const QRectF &rect);
private:
    float _scale;
};

#endif // TIKZVIEW_H
