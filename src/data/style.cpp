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

#include "style.h"

Style::Style() : _name("none"), _data(0)
{
}

Style::Style(QString name, GraphElementData *data) : _name(name), _data(data)
{
}

bool Style::isNone()
{
    return _data == 0;
}

GraphElementData *Style::data() const
{
    return _data;
}

QString Style::name() const
{
    return _name;
}

QColor Style::strokeColor() const
{
    if (_data == 0) return Qt::black;

    QString col = propertyWithDefault("draw", "black");

    QColor namedColor(col);
    if (namedColor.isValid()) {
        return namedColor;
    } else {
        // TODO: read RGB colors
        return QColor(Qt::black);
    }
}

// TODO
int Style::strokeThickness() const
{
    return 1;
}

QPen Style::pen() const
{
    QPen p(strokeColor());
    p.setWidthF((float)strokeThickness() * 3.0f);
    return p;
}

QString Style::propertyWithDefault(QString prop, QString def) const
{
    QString val = _data->property("tikzit " + prop);
    if (val.isNull()) val = _data->property(prop);
    if (val.isNull()) val = def;
    return val;
}
