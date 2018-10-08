#include "stylelist.h"

#include <QTextStream>

StyleList::StyleList(bool edgeStyles, QObject *parent) : QAbstractListModel(parent), _edgeStyles(edgeStyles)
{
    if (edgeStyles) {
        _styles << noneEdgeStyle;
    } else {
        _styles << noneStyle;
    }
}

Style *StyleList::style(QString name)
{
    foreach (Style *s, _styles)
        if (s->name() == name) return s;
    return nullptr;
}

Style *StyleList::style(int i)
{
    return _styles[i];
}

int StyleList::length() const
{
    return _styles.length();
}

void StyleList::addStyle(Style *s)
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

void StyleList::clear()
{
    int n = numInCategory();
    if (n > 0) {
        beginRemoveRows(QModelIndex(), 1, n - 1);
        _styles.clear();
        if (_edgeStyles) _styles << noneEdgeStyle;
        else _styles << noneStyle;
        endRemoveRows();
    } else {
        _styles.clear();
        if (_edgeStyles) _styles << noneEdgeStyle;
        else _styles << noneStyle;
    }

    _category = "";
}

QString StyleList::tikz()
{
    QString str;
    QTextStream code(&str);
    for (int i = 1; i < _styles.length(); ++i)
        code << _styles[i]->tikz() << "\n";
    code.flush();
    return str;
}

int StyleList::numInCategory() const
{
    int c = 0;
    foreach (Style *s, _styles) {
        if (_category == "" || s->isNone() || s->category() == _category) {
            ++c;
        }
    }
    return c;
}

int StyleList::nthInCategory(int n) const
{
    int c = 0;
    for (int j = 0; j < _styles.length(); ++j) {
        if (_category == "" || _styles[j]->isNone() || _styles[j]->category() == _category) {
            if (c == n) return j;
            else ++c;
        }
    }
    return -1;
}

Style *StyleList::styleInCategory(int n) const
{
    return _styles[nthInCategory(n)];
}

QVariant StyleList::data(const QModelIndex &index, int role) const
{
    if (role == Qt::DisplayRole) {
        return QVariant(styleInCategory(index.row())->name());
    } else if (role == Qt::DecorationRole) {
        return QVariant(styleInCategory(index.row())->icon());
    } else {
        return QVariant();
    }
}

int StyleList::rowCount(const QModelIndex &/*parent*/) const
{
    return numInCategory();
}

QString StyleList::category() const
{
    return _category;
}

void StyleList::setCategory(const QString &category)
{
    if (category != _category) {
        beginResetModel();
        _category = category;
        endResetModel();
    }
}
