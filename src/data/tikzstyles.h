#ifndef PROJECT_H
#define PROJECT_H

#include "graphelementdata.h"
#include "nodestyle.h"

#include <QObject>
#include <QString>

class TikzStyles : public QObject
{
    Q_OBJECT
public:
    explicit TikzStyles(QObject *parent = 0);
    void addStyle(QString name, GraphElementData *data);

    NodeStyle *nodeStyle(QString name) const;
    QVector<NodeStyle *> nodeStyles() const;
    void clear();

signals:

public slots:

private:
    QVector<NodeStyle*> _nodeStyles;
};

#endif // PROJECT_H
