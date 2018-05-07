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
    void setScene(QGraphicsScene *scene);
protected:
    void drawBackground(QPainter *painter, const QRectF &rect);
private:
    float _scale;
};

#endif // TIKZVIEW_H
