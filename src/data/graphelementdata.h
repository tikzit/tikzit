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

#ifndef GRAPHELEMENTDATA_H
#define GRAPHELEMENTDATA_H

#include "graphelementproperty.h"

#include <QAbstractItemModel>
#include <QString>
#include <QVariant>
#include <QModelIndex>
#include <QVector>

class GraphElementData : public QAbstractItemModel
{
    Q_OBJECT
public:
    explicit GraphElementData(QVector<GraphElementProperty> init,
                              QObject *parent = 0);
    explicit GraphElementData(QObject *parent = 0);
    ~GraphElementData();
    GraphElementData *copy();
    void setProperty(QString key, QString value);
    void unsetProperty(QString key);
    void setAtom(QString atom);
    void unsetAtom(QString atom);
    QString property(QString key);
    bool hasProperty(QString key);
    bool atom(QString atom);
    int indexOfKey(QString key);
    bool removeRows(int row, int count, const QModelIndex &parent) override;
    bool moveRows(const QModelIndex &sourceParent,
                  int sourceRow, int,
                  const QModelIndex &destinationParent,
                  int destinationRow) override;

    QVariant data(const QModelIndex &index, int role) const override;
    QVariant headerData(int section, Qt::Orientation orientation,
                        int role = Qt::DisplayRole) const override;

    QModelIndex index(int row, int column, const QModelIndex &) const override;
    QModelIndex parent(const QModelIndex &) const override;

    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    int columnCount(const QModelIndex &) const override;

    Qt::ItemFlags flags(const QModelIndex &index) const override;

    bool setData(const QModelIndex &index, const QVariant &value,
                 int role = Qt::EditRole) override;

    void operator <<(GraphElementProperty p);
    void add(GraphElementProperty p);

    QString tikz();
    bool isEmpty();
    QVector<GraphElementProperty> properties() const;

signals:

public slots:

private:
    QVector<GraphElementProperty> _properties;
    GraphElementProperty *root;
};

#endif // GRAPHELEMENTDATA_H
