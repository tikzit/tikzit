#include "graphelementproperty.h"

GraphElementProperty::GraphElementProperty ():
    _key(""), _value(""), _atom(false), _keyMatch(false)
{}

GraphElementProperty::GraphElementProperty(QString key, QString value, bool atom, bool keyMatch) :
    _key(key), _value(value), _atom(atom), _keyMatch(keyMatch)
{}

GraphElementProperty::GraphElementProperty(QString key, QString value) :
    _key(key), _value(value), _atom(false), _keyMatch(false)
{}

GraphElementProperty::GraphElementProperty(QString key, bool keyMatch) :
    _key(key), _value(""), _atom(!keyMatch), _keyMatch(keyMatch)
{}

QString GraphElementProperty::key() const
{ return _key; }

QString GraphElementProperty::value() const
{ return _value; }

void GraphElementProperty::setValue(const QString &value)
{ _value = value; }

bool GraphElementProperty::atom() const
{ return _atom; }

bool GraphElementProperty::keyMatch() const
{ return _keyMatch; }

bool GraphElementProperty::matches(const GraphElementProperty &p)
{
    if (p.atom()) return _atom && _key == p.key();
    if (p.keyMatch()) return !_atom && _key == p.key();
    if (_keyMatch) return !p.atom() && _key == p.key();
    return !_atom && _key == p.key() && _value == p.value();
}

bool GraphElementProperty::operator==(const GraphElementProperty &p)
{
    return matches(p);
}
