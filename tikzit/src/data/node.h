#ifndef NODE_H
#define NODE_H

#include "graphelementdata.h"

#include <QObject>
#include <QPointF>
#include <QString>

class Node : public QObject
{
    Q_OBJECT
public:
    explicit Node(QObject *parent = 0);
    ~Node();

    QPointF point() const;
    void setPoint(const QPointF &point);

    QString name() const;
    void setName(const QString &name);

    QString label() const;
    void setLabel(const QString &label);



    GraphElementData *data() const;
    void setData(GraphElementData *data);

signals:

public slots:

private:
    QPointF _point;
    QString _name;
    QString _label;
    GraphElementData *_data;
};

#endif // NODE_H
