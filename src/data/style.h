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

#ifndef STYLE_H
#define STYLE_H


#include "graphelementdata.h"

#include <QObject>
#include <QColor>
#include <QPen>
#include <QBrush>
#include <QPainterPath>
#include <QIcon>

class Style : public QObject
{
    Q_OBJECT
public:
    enum ArrowTipStyle {
        Flat, Pointer, NoTip
    };

    enum DrawStyle {
        Solid, Dotted, Dashed
    };

    Style();
    Style(QString name, GraphElementData *data);
    bool isNone() const;
    bool isEdgeStyle() const;

    // for node and edge styles
    GraphElementData *data() const;
    QString name() const;
    QColor strokeColor(bool tikzitOverride=true) const;
    int strokeThickness() const;
    QPen pen() const;
    QPainterPath path() const;
    QIcon icon() const;
    void setName(const QString &name);
    QString propertyWithDefault(QString prop, QString def, bool tikzitOverride=true) const;
    QString tikz() const;

    // only relevant for node styles
    QColor fillColor(bool tikzitOverride=true) const;
    QBrush brush() const;
    QString shape(bool tikzitOverride=true) const;

    // only relevant for edge styles
    Style::ArrowTipStyle arrowHead() const;
    Style::ArrowTipStyle arrowTail() const;
    Style::DrawStyle drawStyle() const;
    QString category() const;

protected:
    QString _name;
    GraphElementData *_data;
};
#endif // STYLE_H
