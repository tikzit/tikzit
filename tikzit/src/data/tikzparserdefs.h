#ifndef TIKZPARSERDEFS_H
#define TIKZPARSERDEFS_H

#include "graphelementproperty.h"
#include "graphelementdata.h"
#include "node.h"
#include "tikzgraphassembler.h"

#include <QString>

struct noderef {
    Node *node;
    QString *anchor;
};

#endif // TIKZPARSERDEFS_H
