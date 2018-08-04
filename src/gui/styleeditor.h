#ifndef STYLEEDITOR_H
#define STYLEEDITOR_H

#include "nodestyle.h"
#include "edgestyle.h"
#include "tikzstyles.h"

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

    void refreshDisplay();
    void open();
    void save();
    void closeEvent(QCloseEvent *event) override;

public slots:
    void nodeItemChanged(QModelIndex sel);
    void edgeItemChanged(QModelIndex sel);
    void on_styleListView_clicked();
    void on_edgeStyleListView_clicked();

    void on_name_editingFinished();
    void on_shape_currentTextChanged();
    void on_fillColor_clicked();
    void on_drawColor_clicked();
    void on_tikzitFillColor_clicked();
    void on_tikzitDrawColor_clicked();

    void on_save_clicked();

private:
    Ui::StyleEditor *ui;
    void setColor(QPushButton *btn, QColor col);
    QColor color(QPushButton *btn);
    QStandardItemModel *_nodeModel;
    QStandardItemModel *_edgeModel;
    QStandardItem *_activeItem;
    NodeStyle *_activeNodeStyle;
    EdgeStyle *_activeEdgeStyle;
    TikzStyles *_styles;
    void updateColor(QPushButton *btn, QString name, QString propName);
    QVector<QWidget*> _formWidgets;
    bool _dirty;
};

#endif // STYLEEDITOR_H
