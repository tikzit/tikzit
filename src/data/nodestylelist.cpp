#include "nodestylelist.h"

#include <QTextStream>

NodeStyleList::NodeStyleList(QObject *parent) : QAbstractListModel(parent)
{
}

Style *NodeStyleList::style(QString name)
{
    foreach (Style *s, _styles)
        if (s->name() == name) return s;
    return nullptr;
}

Style *NodeStyleList::style(int i)
{
    return _styles[i];
}

int NodeStyleList::length() const
{
    return _styles.length();
}

void NodeStyleList::addStyle(Style *s)
{
    s->setParent(this);
    if (s->category() == _category) {
        int n = numInCategory();
        beginInsertRows(QModelIndex(), n, n);
        _styles << s;
        endInsertRows();
    } else {
        _styles << s;
    }
}

void NodeStyleList::clear()
{
    int n = numInCategory();
    if (n > 0) {
        beginRemoveRows(QModelIndex(), 0, n - 1);
        _styles.clear();
        endRemoveRows();
    } else {
        _styles.clear();
    }

    _category = "";
}

QString NodeStyleList::tikz()
{
    QString str;
    QTextStream code(&str);
    foreach (Style *s, _styles) code << s->tikz() << "\n";
    code.flush();
    return str;
}

int NodeStyleList::numInCategory() const
{
    int c = 0;
    foreach (Style *s, _styles) {
        if (_category == "" || s->category() == _category) {
            ++c;
        }
    }
    return c;
}

int NodeStyleList::nthInCategory(int n) const
{
    int c = 0;
    for (int j = 0; j < _styles.length(); ++j) {
        if (_category == "" || _styles[j]->category() == _category) {
            if (c == n) return j;
            else ++c;
        }
    }
    return -1;
}

Style *NodeStyleList::styleInCategory(int n) const
{
    return _styles[nthInCategory(n)];
}

QVariant NodeStyleList::data(const QModelIndex &index, int role) const
{
    if (role == Qt::DisplayRole) {
        return QVariant(styleInCategory(index.row())->name());
    } else if (role == Qt::DecorationRole) {
        return QVariant(styleInCategory(index.row())->icon());
    } else {
        return QVariant();
    }
}

int NodeStyleList::rowCount(const QModelIndex &/*parent*/) const
{
    return numInCategory();
}

QString NodeStyleList::category() const
{
    return _category;
}

void NodeStyleList::setCategory(const QString &category)
{
    _category = category;
}
