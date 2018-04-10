#ifndef GRAPHELEMENTDATA_H
#define GRAPHELEMENTDATA_H

#include "graphelementproperty.h"

#include <QAbstractItemModel>
#include <QString>
#include <QVariant>
#include <QModelIndex>
#include <QVector>

class GraphElementData : public QAbstractItemModel
{
    Q_OBJECT
public:
    explicit GraphElementData(QVector<GraphElementProperty> init,
                              QObject *parent = 0);
    explicit GraphElementData(QObject *parent = 0);
    ~GraphElementData();
    GraphElementData *copy();
    void setProperty(QString key, QString value);
    void unsetProperty(QString key);
    void setAtom(QString atom);
    void unsetAtom(QString atom);
    QString property(QString key);
    bool atom(QString atom);

    QVariant data(const QModelIndex &index, int role) const Q_DECL_OVERRIDE;
    QVariant headerData(int section, Qt::Orientation orientation,
                        int role = Qt::DisplayRole) const Q_DECL_OVERRIDE;

    QModelIndex index(int row, int column,
                      const QModelIndex &parent = QModelIndex()) const Q_DECL_OVERRIDE;
    QModelIndex parent(const QModelIndex &index) const Q_DECL_OVERRIDE;

    int rowCount(const QModelIndex &parent = QModelIndex()) const Q_DECL_OVERRIDE;
    int columnCount(const QModelIndex &) const Q_DECL_OVERRIDE;

    Qt::ItemFlags flags(const QModelIndex &index) const Q_DECL_OVERRIDE;

//    bool setData(const QModelIndex &index, const QVariant &value,
//                 int role = Qt::EditRole) Q_DECL_OVERRIDE;
//    bool setHeaderData(int section, Qt::Orientation orientation,
//                       const QVariant &value, int role = Qt::EditRole) Q_DECL_OVERRIDE;

//    bool insertColumns(int position, int columns,
//                       const QModelIndex &parent = QModelIndex()) Q_DECL_OVERRIDE;
//    bool removeColumns(int position, int columns,
//                       const QModelIndex &parent = QModelIndex()) Q_DECL_OVERRIDE;
//    bool insertRows(int position, int rows,
//                    const QModelIndex &parent = QModelIndex()) Q_DECL_OVERRIDE;
//    bool removeRows(int position, int rows,
//                    const QModelIndex &parent = QModelIndex()) Q_DECL_OVERRIDE;

    void operator <<(GraphElementProperty p);
    void add(GraphElementProperty p);

    QString tikz();
    bool isEmpty();
    QVector<GraphElementProperty> properties() const;

signals:

public slots:

private:
    QVector<GraphElementProperty> _properties;
    GraphElementProperty *root;
};

#endif // GRAPHELEMENTDATA_H
