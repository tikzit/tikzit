#ifndef PROJECT_H
#define PROJECT_H

#include "graphelementdata.h"

#include <QObject>
#include <QString>

class Project : public QObject
{
    Q_OBJECT
public:
    explicit Project(QObject *parent = 0);
    void addStyle(QString name, GraphElementData *properties);

signals:

public slots:
};

#endif // PROJECT_H
