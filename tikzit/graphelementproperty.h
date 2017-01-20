#ifndef GRAPHELEMENTPROPERTY_H
#define GRAPHELEMENTPROPERTY_H

#include <QObject>

class GraphElementProperty
{
public:
    GraphElementProperty();
    GraphElementProperty(QString key, QString value, bool atom, bool keyMatch);

    // construct a property
    GraphElementProperty(QString key, QString value);

    // construct an atom or keymatch
    GraphElementProperty(QString key, bool keyMatch = false);

    QString key() const;
    QString value() const;
    void setValue(const QString &value);
    bool atom() const;
    bool keyMatch() const;

    bool matches(const GraphElementProperty &p);
    bool operator==(const GraphElementProperty &p);

signals:

public slots:

private:
    QString _key;
    QString _value;
    bool _atom;
    bool _keyMatch;
};

#endif // GRAPHELEMENTPROPERTY_H
