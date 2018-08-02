#ifndef STYLEEDITOR_H
#define STYLEEDITOR_H

#include "nodestyle.h"
#include "edgestyle.h"

#include <QMainWindow>
#include <QPushButton>
#include <QStandardItemModel>

namespace Ui {
class StyleEditor;
}

class StyleEditor : public QMainWindow
{
    Q_OBJECT

public:
    explicit StyleEditor(QWidget *parent = 0);
    ~StyleEditor();

    void showEvent(QShowEvent *) override;
    void updateFields();

public slots:
    void on_fillColor_clicked();
    void on_styleListView_clicked();
    void on_edgeStyleListView_clicked();

private:
    Ui::StyleEditor *ui;
    void setColor(QPushButton *btn, QColor col);
    QColor color(QPushButton *btn);
    QStandardItemModel *_nodeModel;
    QStandardItemModel *_edgeModel;
    NodeStyle *_activeNodeStyle;
    EdgeStyle *_activeEdgeStyle;
};

#endif // STYLEEDITOR_H
