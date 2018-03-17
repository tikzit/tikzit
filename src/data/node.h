#ifndef NODE_H
#define NODE_H

#include "graphelementdata.h"
#include "nodestyle.h"

#include <QObject>
#include <QPointF>
#include <QString>

class Node : public QObject
{
    Q_OBJECT
public:
    explicit Node(QObject *parent = 0);
    ~Node();

    Node *copy();

    QPointF point() const;
    void setPoint(const QPointF &point);

    QString name() const;
    void setName(const QString &name);

    QString label() const;
    void setLabel(const QString &label);

    GraphElementData *data() const;
    void setData(GraphElementData *data);

    QString styleName() const;
    void setStyleName(const QString &styleName);

    void attachStyle();
    NodeStyle *style() const;

    int tikzLine() const;
    void setTikzLine(int tikzLine);

signals:

public slots:

private:
    QPointF _point;
    QString _name;
    QString _label;
    NodeStyle *_style;
    GraphElementData *_data;
    int _tikzLine;
};

#endif // NODE_H
