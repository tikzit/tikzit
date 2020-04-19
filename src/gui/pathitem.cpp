#include "pathitem.h"
#include "tikzit.h"

PathItem::PathItem(Path *path)
{
    _path = path;
    readPos();
}

void PathItem::readPos()
{
    QPainterPath painterPath;

    foreach (Edge *e, _path->edges()) {
        e->updateControls();

        if (e == _path->edges().first())
            painterPath.moveTo (toScreen(e->tail()));

        if (e->bend() != 0 || !e->basicBendMode()) {
            painterPath.cubicTo(toScreen(e->cp1()),
                toScreen(e->cp2()),
                toScreen(e->head()));
        } else {
            painterPath.lineTo(toScreen(e->head()));
        }
    }

    setPainterPath(painterPath);
}

void PathItem::paint(QPainter *painter, const QStyleOptionGraphicsItem *, QWidget *)
{
    Style *st = _path->edges().first()->style();
    QPen pen = st->pen();
    QBrush brush = st->brush();
    QColor c = brush.color();
    brush.setColor(QColor(c.red(),c.green(),c.blue(),200));
    painter->setPen(pen);
    painter->setBrush(brush);
    painter->drawPath(painterPath());
}

Path *PathItem::path() const
{
    return _path;
}

QPainterPath PathItem::painterPath() const
{
    return _painterPath;
}

void PathItem::setPainterPath(const QPainterPath &painterPath)
{
    prepareGeometryChange();

    _painterPath = painterPath;
    float r = GLOBAL_SCALEF * 0.1;
    _boundingRect = _painterPath.boundingRect().adjusted(-r,-r,r,r);

    update();
}

QRectF PathItem::boundingRect() const
{
    return _boundingRect;
}
