#ifndef PATH_H
#define PATH_H

#include "edge.h"

#include <QObject>

class Path : public QObject
{
    Q_OBJECT
public:
    explicit Path(QObject *parent = nullptr);

private:
    QVector<Edge*> _edges;

};

#endif // PATH_H
