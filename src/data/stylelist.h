#ifndef NODESTYLELIST_H
#define NODESTYLELIST_H

#include "style.h"

#include <QAbstractListModel>

class StyleList : public QAbstractListModel
{
    Q_OBJECT
public:
    explicit StyleList(bool edgeStyles = false, QObject *parent = nullptr);
    Style *style(QString name);
    Style *style(int i);
    int length() const;
    void addStyle(Style *s);
    void removeNthStyle(int n);
    void clear();
    QString tikz();

    int numInCategory() const;
    int nthInCategory(int n) const;
    Style *styleInCategory(int n) const;

    QVariant data(const QModelIndex &index, int role) const override;
    int rowCount(const QModelIndex &/*parent*/) const override;
    bool moveRows(const QModelIndex &sourceParent,
                  int sourceRow,
                  int /*count*/,
                  const QModelIndex &destinationParent,
                  int destinationChild);


    QString category() const;
    void setCategory(const QString &category);

signals:

public slots:

private:
    QVector<Style*> _styles;
    QString _category;
    bool _edgeStyles;
};

#endif // NODESTYLELIST_H
