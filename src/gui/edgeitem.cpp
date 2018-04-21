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
		case EdgeStyle::Flat:
		{
			painter->drawLine(
				toScreen(_edge->head() + hLeft),
				toScreen(_edge->head() + hRight));
			break;
		}
		case EdgeStyle::Pointer:
		{
			QPainterPath pth;
			pth.moveTo(toScreen(_edge->head() + ht + hLeft));
			pth.lineTo(toScreen(_edge->head()));
			pth.lineTo(toScreen(_edge->head() + ht + hRight));
			painter->drawPath(pth);
			break;
		}
	}
	
	switch (_edge->style()->arrowTail()) {
		case EdgeStyle::Flat:
		{
			painter->drawLine(
				toScreen(_edge->tail() + tLeft),
				toScreen(_edge->tail() + tRight));
			break;
		}
		case EdgeStyle::Pointer:
		{
			QPainterPath pth;
			pth.moveTo(toScreen(_edge->tail() + tt + tLeft));
			pth.lineTo(toScreen(_edge->tail()));
			pth.lineTo(toScreen(_edge->tail() + tt + tRight));
			painter->drawPath(pth);
			break;
		}
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

        float r = GLOBAL_SCALEF * _edge->cpDist();
        painter->drawEllipse(toScreen(_edge->source()->point()), r, r);
        painter->drawEllipse(toScreen(_edge->target()->point()), r, r);

        painter->setPen(QPen(draw));
        painter->setBrush(QBrush(fill));

        painter->drawLine(toScreen(_edge->tail()), toScreen(_edge->cp1()));
        painter->drawLine(toScreen(_edge->head()), toScreen(_edge->cp2()));

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
    stroker.setWidth(5);
    stroker.setJoinStyle(Qt::MiterJoin);
    _expPath = (stroker.createStroke(_path) + _path).simplified();

    float r = GLOBAL_SCALEF * (_edge->cpDist() + 0.2);
    _boundingRect = _path.boundingRect().adjusted(-r,-r,r,r);

    update();
}

