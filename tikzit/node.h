#ifndef NODE_H
#define NODE_H

#include <QObject>
#include <QPointF>
#include <QString>

class Node : public QObject
{
    Q_OBJECT
public:
    explicit Node(QObject *parent = 0);
    ~Node();

    QPointF pos() const;
    void setPos(const QPointF &pos);

    QString name() const;
    void setName(const QString &name);

    QString label() const;
    void setLabel(const QString &label);

signals:

public slots:

private:
    QPointF _pos;
    QString _name;
    QString _label;
};

#endif // NODE_H
