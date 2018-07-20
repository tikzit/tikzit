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

#ifndef GRAPHELEMENTPROPERTY_H
#define GRAPHELEMENTPROPERTY_H

#include <QObject>

class GraphElementProperty
{
public:
    GraphElementProperty();
    GraphElementProperty(QString key, QString value, bool atom, bool keyMatch);

    // construct a property
    GraphElementProperty(QString key, QString value);

    // construct an atom or keymatch
    GraphElementProperty(QString key, bool keyMatch = false);

    QString key() const;
    QString value() const;
    void setValue(const QString &value);
    bool atom() const;
    bool keyMatch() const;

    bool matches(const GraphElementProperty &p);
    bool operator==(const GraphElementProperty &p);

    static QString tikzEscape(QString str);
    QString tikz();
signals:

public slots:

private:
    QString _key;
    QString _value;
    bool _atom;
    bool _keyMatch;
};

#endif // GRAPHELEMENTPROPERTY_H
