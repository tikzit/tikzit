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

#ifndef TIKZPARSERDEFS_H
#define TIKZPARSERDEFS_H

#define YY_NO_UNISTD_H 1

#include "graphelementproperty.h"
#include "graphelementdata.h"
#include "node.h"
#include "tikzassembler.h"

#include <QString>
#include <QRectF>
#include <QDebug>

struct noderef {
    Node *node;
    char *anchor;
    bool cycle;
    bool loop;
};

inline int isatty(int) { return 0; }

#endif // TIKZPARSERDEFS_H
