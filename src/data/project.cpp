#include "project.h"

#include "QDebug"

Project::Project(QObject *parent) : QObject(parent)
{

}

void Project::addStyle(QString name, GraphElementData *properties)
{
    qDebug() << "got style {" << name << "} = [" << properties << "]";
}
