#ifndef TIKZSCENE_H
#define TIKZSCENE_H

#include <QWidget>
#include <QGraphicsScene>

class TikzScene : public QGraphicsScene
{
public:
    TikzScene(QObject *parent);
};

#endif // TIKZSCENE_H
