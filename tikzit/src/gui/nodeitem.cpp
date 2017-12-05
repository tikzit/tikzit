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
    setFlag(QGraphicsItem::ItemIsMovable);
    setFlag(QGraphicsItem::ItemSendsGeometryChanges);
    syncPos();
}

void NodeItem::syncPos()
{
    setPos(toScreen(_node->point()));
}


void NodeItem::paint(QPainter *painter, const QStyleOptionGraphicsItem *option, QWidget *widget)
{
    if (_node->style().isNone()) {
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
        QPen pen(_node->style().strokeColor);
        pen.setWidth(_node->style().strokeThickness);
        painter->setPen(pen);
        painter->setBrush(QBrush(_node->style().fillColor));
        painter->drawPath(shape());
    }

    if (_node->label() != "") {
        QString label = _node->label();
        QFont f("Monaco", 9);
        QFontMetrics fm(f);
        int w = fm.width(label) + 4;
        int h = fm.height() + 2;

        QRectF rect = fm.boundingRect(label);
        rect.adjust(-2,-2,2,2);
        rect.moveCenter(QPointF(0,0));
        QPen pen(QColor(200,0,0,120));
        QVector<qreal> d;
        d << 2.0 << 2.0;
        pen.setDashPattern(d);
        painter->setPen(pen);
        painter->setBrush(QBrush(QColor(255,255,100,120)));
        painter->drawRect(rect);

        painter->setPen(QPen(Qt::black));
        painter->setFont(f);
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
    path.addEllipse(QPointF(0,0), GLOBAL_SCALEF * 0.1, GLOBAL_SCALEF * 0.1);
    return path;
}

QRectF NodeItem::boundingRect() const
{
    return shape().boundingRect().adjusted(-4,-4,4,4);
}

QVariant NodeItem::itemChange(GraphicsItemChange change, const QVariant &value)
{
    if (change == ItemPositionChange) {
        QPointF newPos = value.toPointF();
        int gridSize = GLOBAL_SCALE / 8;
        QPointF gridPos(round(newPos.x()/gridSize)*gridSize, round(newPos.y()/gridSize)*gridSize);
        _node->setPoint(fromScreen(gridPos));

        return gridPos;
    } else {
        return QGraphicsItem::itemChange(change, value);
    }
}
