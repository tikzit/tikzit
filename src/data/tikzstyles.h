#ifndef PROJECT_H
#define PROJECT_H

#include "graphelementdata.h"
#include "nodestyle.h"
#include "edgestyle.h"

#include <QObject>
#include <QString>

class TikzStyles : public QObject
{
    Q_OBJECT
public:
    explicit TikzStyles(QObject *parent = 0);
    void addStyle(QString name, GraphElementData *data);

    NodeStyle *nodeStyle(QString name) const;
    EdgeStyle *edgeStyle(QString name) const;
    QVector<NodeStyle *> nodeStyles() const;
    QVector<EdgeStyle *> edgeStyles() const;
    void clear();

signals:

public slots:

private:
    QVector<NodeStyle*> _nodeStyles;
    QVector<EdgeStyle*> _edgeStyles;
};

#endif // PROJECT_H
