#include "edge.h"
#include "tikzit.h"
#include "util.h"

#include <QDebug>
#include <QPointF>

Edge::Edge(Node *s, Node *t, QObject *parent) :
    QObject(parent), _source(s), _target(t)
{
    _data = new GraphElementData();
    _edgeNode = 0;
    _dirty = true;
    _basicBendMode = true;
    _bend = 0;
    _inAngle = 0;
    _outAngle = 0;
    _weight = 0.4f;
    updateControls();
}

Edge::~Edge()
{
    delete _data;
    delete _edgeNode;
}

Node *Edge::source() const
{
    return _source;
}

Node *Edge::target() const
{
    return _target;
}

bool Edge::isSelfLoop()
{
    return (_source == _target);
}

bool Edge::isStraight()
{
    return (_basicBendMode && _bend == 0);
}

GraphElementData *Edge::data() const
{
    return _data;
}

void Edge::setData(GraphElementData *data)
{
    delete _data;
    _data = data;
    setAttributesFromData();
}

QString Edge::sourceAnchor() const
{
    return _sourceAnchor;
}

void Edge::setSourceAnchor(const QString &sourceAnchor)
{
    _sourceAnchor = sourceAnchor;
}

QString Edge::targetAnchor() const
{
    return _targetAnchor;
}

void Edge::setTargetAnchor(const QString &targetAnchor)
{
    _targetAnchor = targetAnchor;
}

Node *Edge::edgeNode() const
{
    return _edgeNode;
}

void Edge::setEdgeNode(Node *edgeNode)
{
    if (_edgeNode != 0) delete _edgeNode;
    _edgeNode = edgeNode;
}

bool Edge::hasEdgeNode()
{
    return _edgeNode != 0;
}

void Edge::updateControls() {
    //if (_dirty) {
    QPointF src = _source->point();
    QPointF targ = _target->point();

    float dx = (targ.x() - src.x());
    float dy = (targ.y() - src.y());

    float outAngleR = 0.0f;
    float inAngleR = 0.0f;

    if (_basicBendMode) {
        float angle = std::atan2(dy, dx);
        float bnd = (float)_bend * (M_PI / 180.0f);
        outAngleR = angle - bnd;
        inAngleR = M_PI + angle + bnd;
        _outAngle = outAngleR * (180.f / M_PI);
        _inAngle = inAngleR * (180.f / M_PI);
    } else {
        outAngleR = (float)_outAngle * (M_PI / 180.0f);
        inAngleR = (float)_inAngle * (M_PI / 180.0f);
    }

    // TODO: calculate head and tail properly, not just for circles
    if (_source->style().isNone()) {
        _tail = src;
    } else {
        _tail = QPointF(src.x() + std::cos(outAngleR) * 0.1,
                        src.y() + std::sin(outAngleR) * 0.1);
    }

    if (_target->style().isNone()) {
        _head = targ;
    } else {
        _head = QPointF(targ.x() + std::cos(inAngleR) * 0.1,
                        targ.y() + std::sin(inAngleR) * 0.1);
    }

    // give a default distance for self-loops
    _cpDist = (dx==0.0f && dy==0.0f) ? _weight : std::sqrt(dx*dx + dy*dy) * _weight;

    _cp1 = QPointF(src.x() + (_cpDist * std::cos(outAngleR)),
                   src.y() + (_cpDist * std::sin(outAngleR)));

    _cp2 = QPointF(targ.x() + (_cpDist * std::cos(inAngleR)),
                   targ.y() + (_cpDist * std::sin(inAngleR)));

    _mid = bezierInterpolateFull (0.5f, _tail, _cp1, _cp2, _head);
//        midTan = [self _findTanFor:mid usingSpanFrom:0.4f to:0.6f];

//        tailTan = [self _findTanFor:tail usingSpanFrom:0.0f to:0.1f];
//        headTan = [self _findTanFor:head usingSpanFrom:1.0f to:0.9f];
    //_dirty = false;
    //}
}

void Edge::setAttributesFromData()
{
    _basicBendMode = true;
    bool ok = true;

    if (_data->atom("bend left")) {
        _bend = -30;
    } else if (_data->atom("bend right")) {
        _bend = 30;
    } else if (_data->property("bend left") != 0) {
        _bend = -_data->property("bend left").toInt(&ok);
        if (!ok) _bend = -30;
    } else if (_data->property("bend right") != 0) {
        _bend = _data->property("bend right").toInt(&ok);
        if (!ok) _bend = 30;
    } else {
        _bend = 0;

        if (_data->property("in") != 0 && _data->property("out") != 0) {
            _basicBendMode = false;
            _inAngle = _data->property("in").toInt(&ok);
            if (!ok) _inAngle = 0;
            _outAngle = _data->property("out").toInt(&ok);
            if (!ok) _outAngle = 180;
        }
    }

    if (_data->property("looseness") != 0) {
        _weight = _data->property("looseness").toFloat(&ok) / 2.5f;
        if (!ok) _weight = 0.4f;
    } else {
        _weight = (isSelfLoop()) ? 1.0f : 0.4f;
    }

    //qDebug() << "bend: " << _bend << " in: " << _inAngle << " out: " << _outAngle;
    _dirty = true;
}

void Edge::updateData()
{
    _data->unsetAtom("loop");
    _data->unsetProperty("in");
    _data->unsetProperty("out");
    _data->unsetAtom("bend left");
    _data->unsetAtom("bend right");
    _data->unsetProperty("bend left");
    _data->unsetProperty("bend right");
    _data->unsetProperty("looseness");

    // TODO: style handling?

    if (_basicBendMode && _bend != 0) {
        QString bendKey;
        int b;
        if (_bend < 0) {
            bendKey = "bend left";
            b = -_bend;
        } else {
            bendKey = "bend right";
            b = _bend;
        }

        if (b == 30) {
            _data->setAtom(bendKey);
        } else {
            _data->setProperty(bendKey, QString::number(b));
        }
    } else {
        _data->setProperty("in", QString::number(_inAngle));
        _data->setProperty("out", QString::number(_outAngle));
    }

    if (_source == _target) _data->setAtom("loop");
    if (!isSelfLoop() && !isStraight() && _weight != 0.4f)
        _data->setProperty("looseness", QString::number(_weight*2.5f, 'f', 2));

}


QPointF Edge::head() const
{
    return _head;
}

QPointF Edge::tail() const
{
    return _tail;
}

QPointF Edge::cp1() const
{
    return _cp1;
}

QPointF Edge::cp2() const
{
    return _cp2;
}

int Edge::bend() const
{
    return _bend;
}

int Edge::inAngle() const
{
    return _inAngle;
}

int Edge::outAngle() const
{
    return _outAngle;
}

float Edge::weight() const
{
    return _weight;
}

bool Edge::basicBendMode() const
{
    return _basicBendMode;
}

float Edge::cpDist() const
{
    return _cpDist;
}

void Edge::setBend(int bend)
{
    _bend = bend;
}

void Edge::setInAngle(int inAngle)
{
    _inAngle = inAngle;
}

void Edge::setOutAngle(int outAngle)
{
    _outAngle = outAngle;
}

void Edge::setWeight(float weight)
{
    _weight = weight;
}

QPointF Edge::mid() const
{
    return _mid;
}


