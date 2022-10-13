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

#include "tikzview.h"
#include "tikzit.h"

#include <QDebug>
#include <QScrollBar>
#include <QSettings>

TikzView::TikzView(QWidget *parent) : QGraphicsView(parent)
{
    setRenderHint(QPainter::Antialiasing);
    setResizeAnchor(QGraphicsView::AnchorViewCenter);
    //setDragMode(QGraphicsView::RubberBandDrag);

    setBackgroundBrush(QBrush(Qt::white));

    _scale = 2.5f;
    scale(2.5, 2.5);
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
    centerOn(QPointF(0.0,0.0));
}

void TikzView::drawBackground(QPainter *painter, const QRectF &rect)
{
    QSettings settings("tikzit", "tikzit");
    QGraphicsView::drawBackground(painter, rect);
    // draw a gray background if disabled
    TikzScene *sc = static_cast<TikzScene*>(scene());
    if (!sc->enabled()) painter->fillRect(rect, QBrush(QColor(240,240,240)));

    // draw the grid

    QPen pen1;
    //pen1.setWidthF(0.5);
    pen1.setCosmetic(true);
    pen1.setColor(settings.value("grid-color-minor", QColor(250,250,255)).value<QColor>());

    QPen pen2 = pen1;
    pen2.setColor(settings.value("grid-color-major", QColor(240,240,250)).value<QColor>());

    QPen pen3 = pen1;
    pen3.setColor(settings.value("grid-color-axes", QColor(220,220,240)).value<QColor>());

    painter->setPen(pen1);

    if (_scale > 0.2f) {
        for (int x = -GRID_SEP; x > rect.left(); x -= GRID_SEP) {
            if (x % (GRID_SEP * GRID_N) != 0) {
                qreal xf = (qreal)x;
                painter->drawLine(xf, rect.top(), xf, rect.bottom());
            }
        }

        for (int x = GRID_SEP; x < rect.right(); x += GRID_SEP) {
            if (x % (GRID_SEP * GRID_N) != 0) {
                qreal xf = (qreal)x;
                painter->drawLine(xf, rect.top(), xf, rect.bottom());
            }
        }

        for (int y = -GRID_SEP; y > rect.top(); y -= GRID_SEP) {
            if (y % (GRID_SEP * GRID_N) != 0) {
                qreal yf = (qreal)y;
                painter->drawLine(rect.left(), yf, rect.right(), yf);
            }
        }

        for (int y = GRID_SEP; y < rect.bottom(); y += GRID_SEP) {
            if (y % (GRID_SEP * GRID_N) != 0) {
                qreal yf = (qreal)y;
                painter->drawLine(rect.left(), yf, rect.right(), yf);
            }
        }
    }

    painter->setPen(pen2);

    for (int x = -GRID_SEP*GRID_N; x > rect.left(); x -= GRID_SEP*GRID_N) {
        qreal xf = (qreal)x;
        painter->drawLine(xf, rect.top(), xf, rect.bottom());
    }

    for (int x = GRID_SEP*GRID_N; x < rect.right(); x += GRID_SEP*GRID_N) {
        qreal xf = (qreal)x;
        painter->drawLine(xf, rect.top(), xf, rect.bottom());
    }

    for (int y = -GRID_SEP*GRID_N; y > rect.top(); y -= GRID_SEP*GRID_N) {
        qreal yf = (qreal)y;
        painter->drawLine(rect.left(), yf, rect.right(), yf);
    }

    for (int y = GRID_SEP*GRID_N; y < rect.bottom(); y += GRID_SEP*GRID_N) {
        qreal yf = (qreal)y;
        painter->drawLine(rect.left(), yf, rect.right(), yf);
    }

    painter->setPen(pen3);
    painter->drawLine(rect.left(), 0, rect.right(), 0);
    painter->drawLine(0, rect.top(), 0, rect.bottom());
}

void TikzView::wheelEvent(QWheelEvent *event)
{
    QSettings settings("tikzit", "tikzit");
    bool shiftScroll = settings.value("shift-to-scroll", false).toBool();
    if ((!shiftScroll && event->modifiers() == Qt::NoModifier) ||
        (shiftScroll && (event->modifiers() == Qt::ShiftModifier)))
    {
        event->setModifiers(Qt::NoModifier);
        QGraphicsView::wheelEvent(event);
    }

    if (event->modifiers() & Qt::ControlModifier) {
        if (event->angleDelta().y() > 0) {
            zoomIn();
        } else if (event->angleDelta().y() < 0) {
            zoomOut();
        }
    } else if (event->modifiers() & Qt::ShiftModifier) {
        horizontalScrollBar()->setValue(horizontalScrollBar()->value() - event->angleDelta().y());
    }
}

