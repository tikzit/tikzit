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
};

inline int isatty(int) { return 0; }

#endif // TIKZPARSERDEFS_H
