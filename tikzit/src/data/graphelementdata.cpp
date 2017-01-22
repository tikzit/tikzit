#include "graphelementdata.h"

#include <QDebug>
#include <QTextStream>

GraphElementData::GraphElementData(QObject *parent) : QAbstractItemModel(parent)
{
    root = new GraphElementProperty();
}

GraphElementData::~GraphElementData()
{
    delete root;
}

void GraphElementData::setProperty(QString key, QString value)
{
    GraphElementProperty m(key, true);
    int i = _properties.indexOf(m);
    if (i != -1) {
        _properties[i].setValue(value);
    } else {
        GraphElementProperty p(key, value);
        _properties << p;
    }
}

void GraphElementData::unsetProperty(QString key)
{
    GraphElementProperty m(key, true);
    int i = _properties.indexOf(m);
    if (i != -1)
        _properties.remove(i);
}

void GraphElementData::add(GraphElementProperty p)
{
    _properties << p;
}

void GraphElementData::operator <<(GraphElementProperty p)
{
    add(p);
}

void GraphElementData::setAtom(QString atom)
{
    GraphElementProperty a(atom);
    int i = _properties.indexOf(a);
    if (i == -1)
        _properties << a;
}

void GraphElementData::unsetAtom(QString atom)
{
    GraphElementProperty a(atom);
    int i = _properties.indexOf(a);
    if (i != -1)
        _properties.remove(i);
}

QString GraphElementData::property(QString key)
{
    GraphElementProperty m(key, true);
    int i = _properties.indexOf(m);
    if (i != -1) {
        return _properties[i].value();
    } else {
        return 0;
    }
}

bool GraphElementData::atom(QString atom)
{
    GraphElementProperty a(atom);
    return (_properties.indexOf(a) != -1);
}

QVariant GraphElementData::data(const QModelIndex &index, int role) const
{
    if (role != Qt::DisplayRole)
        return QVariant();

    if (index.row() >= 0 && index.row() < _properties.length()) {
        const GraphElementProperty &p = _properties[index.row()];
        QString s = (index.column() == 0) ? p.key() : p.value();
        return QVariant(s);
    }
}

QVariant GraphElementData::headerData(int section, Qt::Orientation orientation, int role) const
{
    if (orientation == Qt::Horizontal && role == Qt::DisplayRole) {
        if (section == 0) return QVariant("Key/Atom");
        else return QVariant("Value");
    }

    return QVariant();
}

QModelIndex GraphElementData::index(int row, int column, const QModelIndex &parent) const
{
    return createIndex(row, column, (void*)0);
}

QModelIndex GraphElementData::parent(const QModelIndex &index) const
{
    GraphElementProperty *p = static_cast<GraphElementProperty*>(index.internalPointer());
    if (p == root) return QModelIndex();
    else return createIndex(0,0,static_cast<void*>(root));
}

int GraphElementData::rowCount(const QModelIndex &parent) const
{
    if (parent.isValid()) {
        return 0;
    } else {
        return _properties.size();
    }
}

int GraphElementData::columnCount(const QModelIndex &parent) const
{
    return 2;
}

Qt::ItemFlags GraphElementData::flags(const QModelIndex &index) const
{
    return QAbstractItemModel::flags(index);
}

//bool GraphElementData::setData(const QModelIndex &index, const QVariant &value, int role)
//{

//}

//bool GraphElementData::insertRows(int position, int rows, const QModelIndex &parent)
//{

//}

//bool GraphElementData::removeRows(int position, int rows, const QModelIndex &parent)
//{

//}

QString GraphElementData::tikz() {
    if (_properties.length() == 0) return "";
    QString str;
    QTextStream code(&str);
    code << "[";

    GraphElementProperty p;
    bool first = true;
    foreach(p, _properties) {
        if (!first) code << ", ";
        code << p.tikz();
        first = false;
    }

    code << "]";

    code.flush();
    return str;
}
