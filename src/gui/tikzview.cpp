#include "tikzview.h"
#include "tikzit.h"

#include <QDebug>
#include <QScrollBar>

TikzView::TikzView(QWidget *parent) : QGraphicsView(parent)
{
    setRenderHint(QPainter::Antialiasing);
    //setDragMode(QGraphicsView::RubberBandDrag);

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

void TikzView::setScene(QGraphicsScene *scene)
{
    QGraphicsView::setScene(scene);
    centerOn(QPointF(0.0f,-230.0f));
}

void TikzView::drawBackground(QPainter *painter, const QRectF &rect)
{
    // draw a gray background if disabled
    TikzScene *sc = static_cast<TikzScene*>(scene());
    if (!sc->enabled()) painter->fillRect(rect, QBrush(QColor(240,240,240)));

    // draw the grid

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
        for (int x = -GRID_SEP; x > rect.left(); x -= GRID_SEP) {
            if (x % (GRID_SEP * GRID_N) != 0) painter->drawLine(x, rect.top(), x, rect.bottom());
        }

        for (int x = GRID_SEP; x < rect.right(); x += GRID_SEP) {
            if (x % (GRID_SEP * GRID_N) != 0) painter->drawLine(x, rect.top(), x, rect.bottom());
        }

        for (int y = -GRID_SEP; y > rect.top(); y -= GRID_SEP) {
            if (y % (GRID_SEP * GRID_N) != 0) painter->drawLine(rect.left(), y, rect.right(), y);
        }

        for (int y = GRID_SEP; y < rect.bottom(); y += GRID_SEP) {
            if (y % (GRID_SEP * GRID_N) != 0) painter->drawLine(rect.left(), y, rect.right(), y);
        }
    }

    painter->setPen(pen2);

    for (int x = -GRID_SEP*GRID_N; x > rect.left(); x -= GRID_SEP*GRID_N) {
        painter->drawLine(x, rect.top(), x, rect.bottom());
    }

    for (int x = GRID_SEP*GRID_N; x < rect.right(); x += GRID_SEP*GRID_N) {
        painter->drawLine(x, rect.top(), x, rect.bottom());
    }

    for (int y = -GRID_SEP*GRID_N; y > rect.top(); y -= GRID_SEP*GRID_N) {
        painter->drawLine(rect.left(), y, rect.right(), y);
    }

    for (int y = GRID_SEP*GRID_N; y < rect.bottom(); y += GRID_SEP*GRID_N) {
        painter->drawLine(rect.left(), y, rect.right(), y);
    }

    painter->setPen(pen3);
    painter->drawLine(rect.left(), 0, rect.right(), 0);
    painter->drawLine(0, rect.top(), 0, rect.bottom());
}

