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

#include "graphelementproperty.h"

#include <QRegExp>

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

QString GraphElementProperty::tikzEscape(QString str)
{
    QRegExp re("[0-9a-zA-Z<> \\-'.]*");
    if (re.exactMatch(str)) return str;
    else return "{" + str + "}";
}

QString GraphElementProperty::tikz() {
    if (_atom) return tikzEscape(_key);
    return tikzEscape(_key) + "=" + tikzEscape(_value);
}
