#include "tikzit.h"
#include "nodeitem.h"
#include "tikzscene.h"
#include <cmath>

#include <QPen>
#include <QApplication>
#include <QBrush>
#include <QDebug>
#include <QFont>
#include <QFontMetrics>
#include <QPainterPathStroker>

NodeItem::NodeItem(Node *node)
{
    _node = node;
    setFlag(QGraphicsItem::ItemIsSelectable);
    //setFlag(QGraphicsItem::ItemIsMovable);
    //setFlag(QGraphicsItem::ItemSendsGeometryChanges);
    readPos();
	updateBounds();
}

void NodeItem::readPos()
{
    setPos(toScreen(_node->point()));
}

void NodeItem::writePos()
{
    _node->setPoint(fromScreen(pos()));
}

QRectF NodeItem::labelRect() const {
    QString label = _node->label();
    //QFont f("Courier", 9);
    QFontMetrics fm(Tikzit::LABEL_FONT);

    QRectF rect = fm.boundingRect(label);
    //rect.adjust(-2,-2,2,2);
    rect.moveCenter(QPointF(0,0));
    return rect;
}

void NodeItem::paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *)
{
    if (_node->style()->isNone()) {
        QColor c(180,180,200);
        painter->setPen(QPen(c));
        painter->setBrush(QBrush(c));
        painter->drawEllipse(QPointF(0,0), 1,1);

        QPen pen(QColor(180,180,220));
        QVector<qreal> p;
        p << 2.0 << 2.0;
        pen.setDashPattern(p);
        painter->setPen(pen);
        painter->setBrush(Qt::NoBrush);
        painter->drawPath(shape());
    } else {
        QPen pen(_node->style()->strokeColor());
        pen.setWidth(_node->style()->strokeThickness());
        painter->setPen(pen);
        painter->setBrush(QBrush(_node->style()->fillColor()));
        painter->drawPath(shape());
    }

    if (_node->label() != "") {
        QRectF rect = labelRect();
        QPen pen(QColor(200,0,0,120));
        QVector<qreal> d;
        d << 2.0 << 2.0;
        pen.setDashPattern(d);
        painter->setPen(pen);
        painter->setBrush(QBrush(QColor(255,255,100,120)));
        painter->drawRect(rect);

        painter->setPen(QPen(Qt::black));
        painter->setFont(Tikzit::LABEL_FONT);
        painter->drawText(rect, Qt::AlignCenter, _node->label());
    }

    if (isSelected()) {
        QPainterPath sh = shape();
        QPainterPathStroker stroker;
        stroker.setWidth(4);
        QPainterPath outline = (stroker.createStroke(sh) + sh).simplified();
        painter->setPen(Qt::NoPen);
        painter->setBrush(QBrush(QColor(150,200,255,100)));
        painter->drawPath(outline);
    }

}

QPainterPath NodeItem::shape() const
{
    QPainterPath path;
    path.addEllipse(QPointF(0,0), GLOBAL_SCALEF * 0.2, GLOBAL_SCALEF * 0.2);
    return path;
}

// TODO: nodeitem should sync boundingRect()-relevant stuff (label etc) explicitly,
// to allow prepareGeometryChange()
QRectF NodeItem::boundingRect() const
{
	return _boundingRect;
}

void NodeItem::updateBounds()
{
	prepareGeometryChange();
	QString label = _node->label();
	if (label != "") {
		QFontMetrics fm(Tikzit::LABEL_FONT);
		QRectF labelRect = fm.boundingRect(label);
		labelRect.moveCenter(QPointF(0, 0));
		_boundingRect = labelRect.united(shape().boundingRect()).adjusted(-4, -4, 4, 4);
	} else {
		_boundingRect = shape().boundingRect().adjusted(-4, -4, 4, 4);
	}
}

Node *NodeItem::node() const
{
    return _node;
}

//QVariant NodeItem::itemChange(GraphicsItemChange change, const QVariant &value)
//{
//    if (change == ItemPositionChange) {
//        QPointF newPos = value.toPointF();
//        int gridSize = GLOBAL_SCALE / 8;
//        QPointF gridPos(round(newPos.x()/gridSize)*gridSize, round(newPos.y()/gridSize)*gridSize);
//        _node->setPoint(fromScreen(gridPos));
//
//        return gridPos;
//    } else {
//        return QGraphicsItem::itemChange(change, value);
//    }
//}
