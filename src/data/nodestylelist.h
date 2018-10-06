#ifndef NODESTYLELIST_H
#define NODESTYLELIST_H

#include "style.h"

#include <QAbstractListModel>

class NodeStyleList : public QAbstractListModel
{
    Q_OBJECT
public:
    explicit NodeStyleList(QObject *parent = nullptr);
    Style *style(QString name);
    Style *style(int i);
    int length() const;
    void addStyle(Style *s);
    void clear();
    QString tikz();

    int numInCategory() const;
    int nthInCategory(int n) const;
    Style *styleInCategory(int n) const;

    QVariant data(const QModelIndex &index, int role) const override;
    int rowCount(const QModelIndex &/*parent*/) const override;


    QString category() const;
    void setCategory(const QString &category);

signals:

public slots:

private:
    QVector<Style*> _styles;
    QString _category;
};

#endif // NODESTYLELIST_H
