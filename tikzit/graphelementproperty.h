#ifndef GRAPHELEMENTPROPERTY_H
#define GRAPHELEMENTPROPERTY_H

#include <QObject>

class GraphElementProperty : public QObject
{
    Q_OBJECT
public:
    GraphElementProperty(QString key, QString value, bool atom, bool keyMatch, QObject *parent = 0);

    // construct a property
    GraphElementProperty(QString key, QString value, QObject *parent = 0);

    // construct an atom
    GraphElementProperty(QString key, QObject *parent = 0);

    QString key() const;
    QString value() const;
    bool atom() const;
    bool keyMatch() const;

    bool matches(GraphElementProperty *p);
signals:

public slots:

private:
    QString _key;
    QString _value;
    bool _atom;
    bool _keyMatch;
};

#endif // GRAPHELEMENTPROPERTY_H
