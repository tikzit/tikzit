#include "graph.h"

#include <QTextStream>

Graph::Graph(QObject *parent) : QObject(parent)
{
    _data = new GraphElementData();
    _bbox = QRectF(0,0,0,0);
}

Graph::~Graph()
{
    delete _data;
}

void Graph::removeNode(Node *n) {
    _nodes.removeAll(n);
    inEdges.remove(n);
    outEdges.remove(n);
}

Edge *Graph::addEdge(Node *s, Node *t)
{
    Edge *e = new Edge(s, t, this);
    _edges << e;
    outEdges.insert(s, e);
    inEdges.insert(t, e);
    return e;
}

void Graph::removeEdge(Edge *e)
{
    _edges.removeAll(e);
    outEdges.remove(e->source(), e);
    inEdges.remove(e->target(), e);
}

GraphElementData *Graph::data() const
{
    return _data;
}

void Graph::setData(GraphElementData *data)
{
    delete _data;
    _data = data;
}

const QVector<Node*> &Graph::nodes()
{
    return _nodes;
}

const QVector<Edge*> &Graph::edges()
{
    return _edges;
}

QRectF Graph::bbox() const
{
    return _bbox;
}

bool Graph::hasBbox() {
    return !(_bbox == QRectF(0,0,0,0));
}

void Graph::clearBbox() {
    _bbox = QRectF(0,0,0,0);
}

QString Graph::tikz()
{
    QString str;
    QTextStream code(&str);
//    [NSMutableString
//                                 stringWithFormat:@"\\begin{tikzpicture}%@\n",
//                                 [[self data] tikzList]];

//        if ([self hasBoundingBox]) {
//            [code appendFormat:@"\t\\path [use as bounding box] (%@,%@) rectangle (%@,%@);\n",
//                [NSNumber numberWithFloat:boundingBox.origin.x],
//                [NSNumber numberWithFloat:boundingBox.origin.y],
//                [NSNumber numberWithFloat:boundingBox.origin.x + boundingBox.size.width],
//                [NSNumber numberWithFloat:boundingBox.origin.y + boundingBox.size.height]];
//        }

//    //	NSArray *sortedNodeList = [[nodes allObjects]
//    //				     sortedArrayUsingSelector:@selector(compareTo:)];
//        //NSMutableDictionary *nodeNames = [NSMutableDictionary dictionary];

//        if ([nodes count] > 0) [code appendFormat:@"\t\\begin{pgfonlayer}{nodelayer}\n"];

//        int i = 0;
//        for (Node *n in nodes) {
//            [n updateData];
//            [n setName:[NSString stringWithFormat:@"%d", i]];
//            [code appendFormat:@"\t\t\\node %@ (%d) at (%@, %@) {%@};\n",
//                [[n data] tikzList],
//                i,
//                formatFloat([n point].x, 4),
//                formatFloat([n point].y, 4),
//                [n label]
//            ];
//            i++;
//        }

//        if ([nodes count] > 0) [code appendFormat:@"\t\\end{pgfonlayer}\n"];
//        if ([edges count] > 0) [code appendFormat:@"\t\\begin{pgfonlayer}{edgelayer}\n"];

//        NSString *nodeStr;
//        for (Edge *e in edges) {
//            [e updateData];

//            if ([e hasEdgeNode]) {
//                nodeStr = [NSString stringWithFormat:@"node%@{%@} ",
//                           [[[e edgeNode] data] tikzList],
//                           [[e edgeNode] label]
//                           ];
//            } else {
//                nodeStr = @"";
//            }

//            NSString *edata = [[e data] tikzList];

//            NSString *srcAnchor;
//            NSString *tgtAnchor;

//            if ([[e sourceAnchor] isEqual:@""]) {
//                srcAnchor = @"";
//            } else {
//                srcAnchor = [NSString stringWithFormat:@".%@", [e sourceAnchor]];
//            }

//            if ([[e targetAnchor] isEqual:@""]) {
//                tgtAnchor = @"";
//            } else {
//                tgtAnchor = [NSString stringWithFormat:@".%@", [e targetAnchor]];
//            }

//            [code appendFormat:@"\t\t\\draw%@ (%@%@) to %@(%@%@);\n",
//                ([edata isEqual:@""]) ? @"" : [NSString stringWithFormat:@" %@", edata],
//                [[e source] name],
//                srcAnchor,
//                nodeStr,
//                ([e source] == [e target]) ? @"" : [[e target] name],
//                tgtAnchor
//            ];
//        }

//        if ([edges count] > 0) [code appendFormat:@"\t\\end{pgfonlayer}\n"];

//        [code appendString:@"\\end{tikzpicture}"];

//        [graphLock unlock];

//        return code;
    return str;
}

void Graph::setBbox(const QRectF &bbox)
{
    _bbox = bbox;
}

Node *Graph::addNode() {
    Node *n = new Node(this);
    _nodes << n;
    return n;
}


