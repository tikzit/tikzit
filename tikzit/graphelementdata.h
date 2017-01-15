#ifndef GRAPHELEMENTDATA_H
#define GRAPHELEMENTDATA_H

#include <QObject>
#include <QString>

class GraphElementData : public QObject
{
    Q_OBJECT
public:
    explicit GraphElementData(QObject *parent = 0);
    void setProperty(QString key, QString value);
    void unsetProperty(QString key);
    void setAtom(QString atom);
    void unsetAtom(QString atom);
    QString property(QString key);
    QString atom(QString atom);

signals:

public slots:
};

#endif // GRAPHELEMENTDATA_H
