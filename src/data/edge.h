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

#ifndef EDGE_H
#define EDGE_H

#include "graphelementdata.h"
#include "node.h"
#include "edgestyle.h"

#include <QObject>
#include <QPointF>

class Edge : public QObject
{
    Q_OBJECT
public:
    explicit Edge(Node *s, Node *t, QObject *parent = 0);
    ~Edge();
    Edge *copy(QMap<Node *, Node *> *nodeTable = 0);

    Node *source() const;
    Node *target() const;

    bool isSelfLoop();
    bool isStraight();

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    QString sourceAnchor() const;
    void setSourceAnchor(const QString &sourceAnchor);

    QString targetAnchor() const;
    void setTargetAnchor(const QString &targetAnchor);

    Node *edgeNode() const;
    void setEdgeNode(Node *edgeNode);
    bool hasEdgeNode();

    void updateControls();
    void setAttributesFromData();
    void updateData();

    QPointF head() const;
    QPointF tail() const;
    QPointF cp1() const;
    QPointF cp2() const;
    QPointF mid() const;
	QPointF headTangent() const;
	QPointF tailTangent() const;

    int bend() const;
    int inAngle() const;
    int outAngle() const;
    float weight() const;
    bool basicBendMode() const;
    float cpDist() const;

    void setBasicBendMode(bool mode);
    void setBend(int bend);
    void setInAngle(int inAngle);
    void setOutAngle(int outAngle);
    void setWeight(float weight);

    int tikzLine() const;
    void setTikzLine(int tikzLine);


	void attachStyle();
	QString styleName() const;
	void setStyleName(const QString & styleName);
	EdgeStyle *style() const;

signals:

public slots:

private:
	QPointF bezierTangent(float start, float end) const;
    QString _sourceAnchor;
    QString _targetAnchor;

    // owned
    Node *_edgeNode;
    GraphElementData *_data;

    // referenced
    Node *_source;
    Node *_target;


	EdgeStyle *_style;

    bool _dirty;
    bool _basicBendMode;
    int _bend;
    int _inAngle;
    int _outAngle;
    float _weight;
    float _cpDist;

    QPointF _head;
    QPointF _tail;
    QPointF _cp1;
    QPointF _cp2;
    QPointF _mid;

	QPointF _headTangent;
	QPointF _tailTangent;

    int _tikzLine;
};

#endif // EDGE_H
