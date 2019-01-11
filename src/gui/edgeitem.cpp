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

#include "tikzit.h"
#include "edgeitem.h"

#include <QPainterPath>
#include <QPen>

EdgeItem::EdgeItem(Edge *edge)
{
    _edge = edge;
    setFlag(QGraphicsItem::ItemIsSelectable);

    _cp1Item = new QGraphicsEllipseItem(this);
    _cp1Item->setParentItem(this);
    _cp1Item->setRect(GLOBAL_SCALEF * (-0.1), GLOBAL_SCALEF * (-0.1),
                      GLOBAL_SCALEF * 0.2, GLOBAL_SCALEF * 0.2);
    _cp1Item->setVisible(false);

    _cp2Item = new QGraphicsEllipseItem(this);
    _cp2Item->setParentItem(this);
    _cp2Item->setRect(GLOBAL_SCALEF * (-0.1), GLOBAL_SCALEF * (-0.1),
                      GLOBAL_SCALEF * 0.2, GLOBAL_SCALEF * 0.2);
    _cp2Item->setVisible(false);

    readPos();
}

void EdgeItem::readPos()
{
    //_edge->setAttributesFromData();
    _edge->updateControls();
    QPainterPath path;

    path.moveTo (toScreen(_edge->tail()));

	if (_edge->bend() != 0 || !_edge->basicBendMode()) {
		path.cubicTo(toScreen(_edge->cp1()),
			toScreen(_edge->cp2()),
			toScreen(_edge->head()));
	}
	else {
		path.lineTo(toScreen(_edge->head()));
	}
    
    setPath(path);

    _cp1Item->setPos(toScreen(_edge->cp1()));
    _cp2Item->setPos(toScreen(_edge->cp2()));
}

void EdgeItem::paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *)
{
    //QGraphicsPathItem::paint(painter, option, widget);
	QPen pen = _edge->style()->pen();
	painter->setPen(pen);
    painter->setBrush(Qt::NoBrush);
    painter->drawPath(path());

	QPointF ht = _edge->headTangent();
	QPointF hLeft(-ht.y(), ht.x());
	QPointF hRight(ht.y(), -ht.x());
	QPointF tt = _edge->tailTangent();
	QPointF tLeft(-ht.y(), ht.x());
	QPointF tRight(ht.y(), -ht.x());

	pen.setStyle(Qt::SolidLine);
	painter->setPen(pen);

	
	
	switch (_edge->style()->arrowHead()) {
        case Style::Flat:
		{
			painter->drawLine(
				toScreen(_edge->head() + hLeft),
				toScreen(_edge->head() + hRight));
			break;
		}
        case Style::Pointer:
		{
			QPainterPath pth;
			pth.moveTo(toScreen(_edge->head() + ht + hLeft));
			pth.lineTo(toScreen(_edge->head()));
			pth.lineTo(toScreen(_edge->head() + ht + hRight));
			painter->drawPath(pth);
			break;
		}
    case Style::NoTip:
        break;
    }

    //QPen outline = QPen(Qt::red);
    //painter->setPen(outline);
    //painter->drawPath(_expPath);
    //painter->setPen(pen);
	
	switch (_edge->style()->arrowTail()) {
        case Style::Flat:
		{
			painter->drawLine(
				toScreen(_edge->tail() + tLeft),
				toScreen(_edge->tail() + tRight));
			break;
		}
        case Style::Pointer:
		{
			QPainterPath pth;
			pth.moveTo(toScreen(_edge->tail() + tt + tLeft));
			pth.lineTo(toScreen(_edge->tail()));
			pth.lineTo(toScreen(_edge->tail() + tt + tRight));
			painter->drawPath(pth);
			break;
		}
        case Style::NoTip:
            break;
	}

    if (isSelected()) {
        QColor draw;
        QColor draw1;
        QColor fill;

        if (_edge->basicBendMode()) {
            draw = Qt::blue;
            draw1 = QColor(100,100,255,100);
            fill = QColor(200,200,255,50);
        } else {
            draw = Qt::darkGreen;
            draw1 = QColor(0, 150, 0, 50);
            fill = QColor(200,255,200,150);
        }

        painter->setPen(QPen(draw1));

        qreal r = GLOBAL_SCALEF * _edge->cpDist();
        painter->drawEllipse(toScreen(_edge->source()->point()), r, r);
        painter->drawEllipse(toScreen(_edge->target()->point()), r, r);

        painter->setPen(QPen(draw));
        painter->setBrush(QBrush(fill));

        painter->drawLine(toScreen(_edge->tail()), toScreen(_edge->cp1()));
        painter->drawLine(toScreen(_edge->head()), toScreen(_edge->cp2()));

        if (scene()) {
            TikzScene *sc = static_cast<TikzScene*>(scene());

            painter->setFont(Tikzit::LABEL_FONT);
            QFontMetrics fm(Tikzit::LABEL_FONT);
            QRectF rect = fm.boundingRect("<>");

            if (sc->highlightHeads()) {
                QPointF headMark(_edge->head().x(), _edge->head().y() + _edge->cpDist() - 0.25);
                rect.moveCenter(toScreen(headMark));
                painter->drawText(rect, Qt::AlignCenter, "<>");
            } else if (sc->highlightTails()) {
                QPointF tailMark(_edge->tail().x(), _edge->tail().y() + _edge->cpDist() - 0.25);
                rect.moveCenter(toScreen(tailMark));
                painter->drawText(rect, Qt::AlignCenter, "<>");
            }
        }

        //painter->drawEllipse(toScreen(_edge->cp1()), r, r);
        //painter->drawEllipse(toScreen(_edge->cp2()), r, r);

        _cp1Item->setPen(QPen(draw));
        _cp1Item->setBrush(QBrush(fill));
        _cp1Item->setVisible(true);

        _cp2Item->setPen(QPen(draw));
        _cp2Item->setBrush(QBrush(fill));
        _cp2Item->setVisible(true);

        r = GLOBAL_SCALEF * 0.05;
        painter->setPen(QPen(Qt::black));
        painter->setBrush(QBrush(QColor(255,255,255,200)));
        painter->drawEllipse(toScreen(_edge->mid()), r, r);
    } else {
        _cp1Item->setVisible(false);
        _cp2Item->setVisible(false);
    }
}

QRectF EdgeItem::boundingRect() const
{
    return _boundingRect;
}

QPainterPath EdgeItem::shape() const
{
    return _expPath;
}

Edge *EdgeItem::edge() const
{
    return _edge;
}

QGraphicsEllipseItem *EdgeItem::cp1Item() const
{
    return _cp1Item;
}

QGraphicsEllipseItem *EdgeItem::cp2Item() const
{
    return _cp2Item;
}

QPainterPath EdgeItem::path() const
{
    return _path;
}

void EdgeItem::setPath(const QPainterPath &path)
{
	prepareGeometryChange();

	_path = path;

    // get the shape of the edge, and expand a bit to make selection easier
    QPainterPathStroker stroker;
    stroker.setWidth(8);
    stroker.setJoinStyle(Qt::MiterJoin);
    _expPath = stroker.createStroke(_path).simplified();

    float r = GLOBAL_SCALEF * (_edge->cpDist() + 0.2);
    _boundingRect = _path.boundingRect().adjusted(-r,-r,r,r);

    update();
}

