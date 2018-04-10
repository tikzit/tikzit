#include "tikzstyles.h"
#include "nodestyle.h"

#include <QDebug>

TikzStyles::TikzStyles(QObject *parent) : QObject(parent)
{

}

NodeStyle *TikzStyles::nodeStyle(QString name) const
{
    foreach (NodeStyle *s , _nodeStyles)
        if (s->name() == name) return s;
    return noneStyle;
}

EdgeStyle *TikzStyles::edgeStyle(QString name) const
{
    foreach (EdgeStyle *s , _edgeStyles)
        if (s->name() == name) return s;
    return noneEdgeStyle;
}

QVector<NodeStyle *> TikzStyles::nodeStyles() const
{
    return _nodeStyles;
}

void TikzStyles::clear()
{
    _nodeStyles.clear();
    _edgeStyles.clear();
}

QVector<EdgeStyle *> TikzStyles::edgeStyles() const
{
    return _edgeStyles;
}

void TikzStyles::addStyle(QString name, GraphElementData *data)
{
    if (data->atom("-") || data->atom("->") || data->atom("-|") ||
        data->atom("<-") || data->atom("<->") || data->atom("<-|") ||
        data->atom("|-") || data->atom("|->") || data->atom("|-|"))
    { // edge style
        qDebug() << "got edge style" << name;
        _edgeStyles << new EdgeStyle(name, data);
    } else { // node style
        qDebug() << "got node style" << name;
        _nodeStyles << new NodeStyle(name, data);
    }
}
