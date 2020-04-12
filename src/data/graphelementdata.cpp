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

#include "graphelementdata.h"

#include <QDebug>
#include <QTextStream>

GraphElementData::GraphElementData(QVector<GraphElementProperty> init, QObject *parent) : QAbstractItemModel(parent)
{
    _properties = init;
}

GraphElementData::GraphElementData(QObject *parent) : QAbstractItemModel(parent) {
}


GraphElementData *GraphElementData::copy()
{
    return new GraphElementData(_properties);
}

void GraphElementData::setProperty(QString key, QString value)
{
    int i = indexOfKey(key);
    if (i != -1) {
        _properties[i].setValue(value);
    } else {
        GraphElementProperty p(key, value);
        _properties << p;
    }
}

void GraphElementData::unsetProperty(QString key)
{
    int i = indexOfKey(key);
    if (i != -1)
        _properties.remove(i);
}

void GraphElementData::add(GraphElementProperty p)
{
    int i = _properties.size();
    beginInsertRows(QModelIndex(), i, i);
    _properties << p;
    endInsertRows();
}

void GraphElementData::operator <<(GraphElementProperty p)
{
    add(p);
}

void GraphElementData::setAtom(QString atom)
{
    int i = indexOfKey(atom);
    if (i == -1)
        _properties << GraphElementProperty(atom);
}

void GraphElementData::unsetAtom(QString atom)
{
    int i = indexOfKey(atom);
    if (i != -1)
        _properties.remove(i);
}

QString GraphElementData::property(QString key)
{
    int i = indexOfKey(key);
    if (i != -1) {
        return _properties[i].value();
    } else {
        return QString(); // null QString
    }
}

bool GraphElementData::hasProperty(QString key)
{
    return (indexOfKey(key) != -1);
}

bool GraphElementData::atom(QString atom)
{
    int idx = indexOfKey(atom);
    return (idx != -1 && _properties[idx].atom());
}

int GraphElementData::indexOfKey(QString key)
{
    for (int i = 0; i < _properties.size(); ++i) {
		QString key1 = _properties[i].key();
        if (key1 == key) return i;
    }
    return -1;
}

void GraphElementData::mergeData(GraphElementData *d)
{
    GraphElementProperty p;
    foreach (p, d->properties()) {
        if (!hasProperty(p.key())) add(p);
    }
}

bool GraphElementData::removeRows(int row, int /*count*/, const QModelIndex &parent)
{
    if (row >= 0 && row < _properties.length()) {
        beginRemoveRows(parent, row, row+1);
        _properties.remove(row);
        endRemoveRows();
        return true;
    } else {
        return false;
    }
}

bool GraphElementData::moveRows(const QModelIndex &sourceParent,
                                int sourceRow,
                                int /*count*/,
                                const QModelIndex &destinationParent,
                                int destinationRow)
{
    if (sourceRow >= 0 && sourceRow < _properties.length() &&
        destinationRow >= 0 && destinationRow <= _properties.length())
    {
        beginMoveRows(sourceParent, sourceRow, sourceRow, destinationParent, destinationRow);
        GraphElementProperty p = _properties[sourceRow];
        _properties.remove(sourceRow);
        if (sourceRow < destinationRow) {
            _properties.insert(destinationRow - 1, p);
        } else {
            _properties.insert(destinationRow, p);
        }
        endMoveRows();
        return true;
    } else {
        return false;
    }
}

QVariant GraphElementData::data(const QModelIndex &index, int role) const
{
    if (role == Qt::DisplayRole || role == Qt::EditRole) {
        if (index.row() >= 0 && index.row() < _properties.length()) {
            const GraphElementProperty &p = _properties[index.row()];
            QString s = (index.column() == 0) ? p.key() : p.value();
            return QVariant(s);
        }
    }

    return QVariant();
}

QVariant GraphElementData::headerData(int section, Qt::Orientation orientation, int role) const
{
    if (orientation == Qt::Horizontal && role == Qt::DisplayRole) {
        if (section == 0) return QVariant("Key/Atom");
        else return QVariant("Value");
    }

    return QVariant();
}

QModelIndex GraphElementData::index(int row, int column, const QModelIndex &) const
{
    return createIndex(row, column, (void*)0);
}

QModelIndex GraphElementData::parent(const QModelIndex &) const
{
    // there is no nesting, so always return an invalid index
    return QModelIndex();
}

int GraphElementData::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid()) {
        return 0;
    } else {
        return _properties.size();
    }
}

int GraphElementData::columnCount(const QModelIndex &) const
{
    return 2;
}

Qt::ItemFlags GraphElementData::flags(const QModelIndex &index) const
{
    if (index.row() >= 0 && index.row() < _properties.length()) {
        if (index.column() == 0 ||
            (!_properties[index.row()].atom() && index.column() == 1))
        {
            return QAbstractItemModel::flags(index) | Qt::ItemIsEditable;
        }
    }
    return QAbstractItemModel::flags(index);
}

bool GraphElementData::setData(const QModelIndex &index, const QVariant &value, int role)
{
    bool success = false;
    if (index.row() >= 0 && index.row() < _properties.length()) {
        if (index.column() == 0) {
            _properties[index.row()].setKey(value.toString());
            success = true;
        } else if (index.column() == 1 && !_properties[index.row()].atom()) {
            _properties[index.row()].setValue(value.toString());
            success = true;
        }
    }

    if (success) {
        QVector<int> roles;
        roles << role;
        emit dataChanged(index, index, roles);
    }

    return success;
}

QString GraphElementData::tikz() {
    if (_properties.length() == 0) return "";
    QString str;
    QTextStream code(&str);
    code << "[";

    GraphElementProperty p;
    bool first = true;
    foreach(p, _properties) {
        if (!first) code << ", ";
        code << p.tikz();
        first = false;
    }

    code << "]";

    code.flush();
    return str;
}

bool GraphElementData::isEmpty()
{
    return _properties.isEmpty();
}

QVector<GraphElementProperty> GraphElementData::properties() const
{
    return _properties;
}

GraphElementData *GraphElementData::pathData() const
{
    GraphElementData *d = new GraphElementData();
    foreach(GraphElementProperty p, _properties) {
        if (isPathProperty(p.key())) d->add(p);
    }
    return d;
}

GraphElementData *GraphElementData::nonPathData() const
{
    GraphElementData *d = new GraphElementData();
    foreach(GraphElementProperty p, _properties) {
        if (!isPathProperty(p.key())) d->add(p);
    }
    return d;
}

bool GraphElementData::isPathProperty(QString key)
{
    return (key == "bend left" ||
            key == "bend right" ||
            key == "in" ||
            key == "out" ||
            key == "looseness");
}
