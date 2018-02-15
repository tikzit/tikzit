#include "tikzview.h"
#include "tikzit.h"

#include <QDebug>
#include <QScrollBar>

TikzView::TikzView(QWidget *parent) : QGraphicsView(parent)
{
    setRenderHint(QPainter::Antialiasing);
    setDragMode(QGraphicsView::RubberBandDrag);

    _scale = 1.0f;
}

void TikzView::zoomIn()
{
    _scale *= 1.6f;
    scale(1.6,1.6);
}

void TikzView::zoomOut()
{
    _scale *= 0.625f;
    scale(0.625,0.625);
}

void TikzView::drawBackground(QPainter *painter, const QRectF &rect)
{
    // draw the grid
    int step = GLOBAL_SCALE / 8;

    QPen pen1;
    pen1.setWidth(1);
    pen1.setCosmetic(true);
    pen1.setColor(QColor(230,230,230));

    QPen pen2 = pen1;
    pen2.setColor(QColor(200,200,200));

    QPen pen3 = pen1;
    pen3.setColor(QColor(160,160,160));

    painter->setPen(pen1);

    if (_scale > 0.2f) {
        for (int x = -step; x > rect.left(); x -= step) {
            if (x % (step * 8) != 0) painter->drawLine(x, rect.top(), x, rect.bottom());
        }

        for (int x = step; x < rect.right(); x += step) {
            if (x % (step * 8) != 0) painter->drawLine(x, rect.top(), x, rect.bottom());
        }

        for (int y = -step; y > rect.top(); y -= step) {
            if (y % (step * 8) != 0) painter->drawLine(rect.left(), y, rect.right(), y);
        }

        for (int y = step; y < rect.bottom(); y += step) {
            if (y % (step * 8) != 0) painter->drawLine(rect.left(), y, rect.right(), y);
        }
    }

    painter->setPen(pen2);

    for (int x = -step*8; x > rect.left(); x -= step*8) {
        painter->drawLine(x, rect.top(), x, rect.bottom());
    }

    for (int x = step*8; x < rect.right(); x += step*8) {
        painter->drawLine(x, rect.top(), x, rect.bottom());
    }

    for (int y = -step*8; y > rect.top(); y -= step*8) {
        painter->drawLine(rect.left(), y, rect.right(), y);
    }

    for (int y = step*8; y < rect.bottom(); y += step*8) {
        painter->drawLine(rect.left(), y, rect.right(), y);
    }

    painter->setPen(pen3);
    painter->drawLine(rect.left(), 0, rect.right(), 0);
    painter->drawLine(0, rect.top(), 0, rect.bottom());
}

