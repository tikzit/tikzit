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
    return noneStyle; //NodeStyle(name, NodeShape::Circle, Qt::white);
}

QVector<NodeStyle *> TikzStyles::nodeStyles() const
{
    return _nodeStyles;
}

void TikzStyles::clear()
{
    _nodeStyles.clear();
}

void TikzStyles::addStyle(QString name, GraphElementData *data)
{
    //qDebug() << "got style {" << name << "} = [" << data << "]";
    if (!data->property("fill").isNull()) { // node style
        _nodeStyles << new NodeStyle(name, data);
    } else { // edge style
        // TODO: edge styles
    }
}
