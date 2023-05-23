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

#ifndef PROJECT_H
#define PROJECT_H

#include "graphelementdata.h"
#include "stylelist.h"
#include "style.h"

#include <QObject>
#include <QString>
#include <QColor>
#include <QStandardItemModel>

class TikzStyles : public QObject
{
    Q_OBJECT
public:
    explicit TikzStyles(QObject *parent = 0);
    void addStyle(QString name, GraphElementData *data);

    Style *nodeStyle(QString name) const;
    Style *edgeStyle(QString name) const;
    QStringList categories() const;
    QString tikz() const;
    void clear();

    bool loadStyles(QString fileName);
    bool saveStyles(QString fileName);
    bool checkStyles();
    void refreshModels(QStandardItemModel *nodeModel,
                       QStandardItemModel *edgeModel,
                       QString category="",
                       bool includeNone=true);

    StyleList *nodeStyles() const;
    StyleList *edgeStyles() const;

signals:

public slots:

private:
    StyleList *_nodeStyles;
    StyleList* _edgeStyles;
    QStringList _colNames;
    QVector<QColor> _cols;
};

#endif // PROJECT_H
