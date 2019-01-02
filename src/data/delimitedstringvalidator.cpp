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

#include "delimitedstringvalidator.h"

DelimitedStringValidator::DelimitedStringValidator(QObject *parent) : QValidator(parent)
{
}

QValidator::State DelimitedStringValidator::validate(QString &input, int &/*pos*/) const
{
    int depth = braceDepth(input);
    if (depth == 0) return Acceptable;
    else if (depth > 0) return Intermediate;
    else return Invalid;
}

void DelimitedStringValidator::fixup(QString &input) const
{
    int depth = braceDepth(input);
    if (depth > 0) input.append(QString("}").repeated(depth));
}

int DelimitedStringValidator::braceDepth(QString input) const
{
    int depth = 0;
    bool escape = false;
    for (int i = 0; i < input.length(); ++i) {
        QCharRef c = input[i];
        if (escape) {
            escape = false;
        } else if (c == '\\') {
            escape = true;
        } else if (c == '{') {
            depth++;
        } else if (c == '}') {
            depth--;
            if (depth < 0) return -1;
        }
    }

    return depth;
}
