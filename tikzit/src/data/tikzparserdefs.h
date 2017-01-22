#ifndef TIKZPARSERDEFS_H
#define TIKZPARSERDEFS_H

#include "graphelementproperty.h"
#include "graphelementdata.h"
#include "node.h"
#include "tikzgraphassembler.h"

#include <QString>
#include <QRectF>
#include <QDebug>

struct noderef {
    Node *node;
    char *anchor;
};

#endif // TIKZPARSERDEFS_H
