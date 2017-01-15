#include "graphelementproperty.h"

GraphElementProperty::GraphElementProperty(QString key, QString value,
                                           bool atom, bool keyMatch, QObject *parent) :
    QObject(parent), _key(key), _value(value), _atom(atom), _keyMatch(keyMatch)
{}

GraphElementProperty::GraphElementProperty(QString key, QString value, QObject *parent) :
    QObject(parent), _key(key), _value(value), _atom(false), _keyMatch(false)
{}

GraphElementProperty::GraphElementProperty(QString key, QObject *parent) :
    QObject(parent), _key(key), _value(""), _atom(true), _keyMatch(false)
{}

QString GraphElementProperty::key() const
{ return _key; }

QString GraphElementProperty::value() const
{ return _value; }

bool GraphElementProperty::atom() const
{ return _atom; }

bool GraphElementProperty::keyMatch() const
{ return _keyMatch; }

bool GraphElementProperty::matches(GraphElementProperty *p)
{
    if (p->atom()) return _atom && _key == p->key();
    if (p->keyMatch()) return !_atom && _key == p->key();
    if (_keyMatch) return !p->atom() && _key == p->key();
    return !_atom && _key == p->key() && _value == p->value();
}
