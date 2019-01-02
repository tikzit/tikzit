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

/*!
 * A class which holds either a single key/value pair (i.e. a proper property)
 * or simply a key with no value (i.e. an atom).
 */

#ifndef GRAPHELEMENTPROPERTY_H
#define GRAPHELEMENTPROPERTY_H

#include <QObject>

class GraphElementProperty
{
public:
    GraphElementProperty();

    GraphElementProperty(QString key, QString value, bool atom);

    /*!
     * \brief GraphElementProperty constructs a proper property with the given key/value
     * \param key
     * \param value
     */
    GraphElementProperty(QString key, QString value);

    /*!
     * \brief GraphElementProperty constructs an atom with the given key
     * \param key
     */
    GraphElementProperty(QString key);

    QString key() const;
    void setKey(const QString &key);
    QString value() const;
    void setValue(const QString &value);
    bool atom() const;

    /*!
     * \brief operator == returns true for atoms if the keys match and for properties
     * if the keys and values match. Note a property is never equal to an atom.
     * \param p
     * \return
     */
    bool operator==(const GraphElementProperty &p);

    /*!
     * \brief tikzEscape prepares a property key or value for export to tikz code. If
     * the property only contains numbers, letters, whitespace, or the characters (<,>,-)
     * this method does nothing. Otherwise, wrap the property in curly braces.
     * \param str
     * \return
     */
    static QString tikzEscape(QString str);

    /*!
     * \brief tikz escapes the key/value of a propery or atom and outputs it as "key=value"
     * for properties and "key" for atoms.
     * \return
     */
    QString tikz();

signals:

public slots:

private:
    QString _key;
    QString _value;
    bool _atom;
};

#endif // GRAPHELEMENTPROPERTY_H
