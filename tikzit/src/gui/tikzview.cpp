#include "tikzview.h"

#include <QDebug>

TikzView::TikzView(QWidget *parent) : QGraphicsView(parent)
{
    setRenderHint(QPainter::Antialiasing);
    qDebug() << "TikzView()";
}

void TikzView::zoomIn()
{
    scale(1.6,1.6);
}

void TikzView::zoomOut()
{
    scale(0.625,0.625);
}

