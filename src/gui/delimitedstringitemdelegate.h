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
 * A QItemDelete that attaches a DelimitedStringValidator to any QLineEdit
 */

#ifndef DELIMITEDSTRINGITEMDELEGATE_H
#define DELIMITEDSTRINGITEMDELEGATE_H

#include "delimitedstringvalidator.h"

#include <QWidget>
#include <QItemDelegate>

class DelimitedStringItemDelegate : public QItemDelegate
{
    Q_OBJECT
public:
    DelimitedStringItemDelegate(QObject *parent=nullptr);
    virtual ~DelimitedStringItemDelegate() override;
    QWidget *createEditor(QWidget *parent, const QStyleOptionViewItem &option, const QModelIndex &index) const override;
private:
    DelimitedStringValidator *_validator;
};

#endif // DELIMITEDSTRINGITEMDELEGATE_H
