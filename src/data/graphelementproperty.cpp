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

#include <QRegularExpression>

GraphElementProperty::GraphElementProperty ():
    _key(""), _value(""), _atom(false)
{}

GraphElementProperty::GraphElementProperty(QString key, QString value, bool atom) :
    _key(key), _value(value), _atom(atom)
{}

GraphElementProperty::GraphElementProperty(QString key, QString value) :
    _key(key), _value(value), _atom(false)
{}

GraphElementProperty::GraphElementProperty(QString key) :
    _key(key), _value(""), _atom(true)
{}

QString GraphElementProperty::key() const
{ return _key; }

QString GraphElementProperty::value() const
{ return _value; }

void GraphElementProperty::setValue(const QString &value)
{ _value = value; }

bool GraphElementProperty::atom() const
{ return _atom; }


bool GraphElementProperty::operator==(const GraphElementProperty &p)
{
    if (_atom) return p.atom() && p.key() == _key;
    else return !p.atom() && p.key() == _key && p.value() == _value;
}

QString GraphElementProperty::tikzEscape(QString str)
{
    QRegularExpression re("^[0-9a-zA-Z<> \\-'.]*$");
    if (re.match(str).hasMatch()) return str;
    else return "{" + str + "}";
}

QString GraphElementProperty::tikz() {
    if (_atom) return tikzEscape(_key);
    return tikzEscape(_key) + "=" + tikzEscape(_value);
}

void GraphElementProperty::setKey(const QString &key)
{
    _key = key;
}
