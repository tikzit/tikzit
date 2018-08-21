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

    void open();
    void save();
    void closeEvent(QCloseEvent *event) override;

public slots:
    void refreshDisplay();
    void nodeItemChanged(QModelIndex sel);
    void edgeItemChanged(QModelIndex sel);
    void categoryChanged();
    void currentCategoryChanged();
    void refreshCategories();
    void propertyChanged();
    void on_styleListView_clicked();
    void on_edgeStyleListView_clicked();

    void on_name_editingFinished();
    void on_shape_currentTextChanged();
    void on_fillColor_clicked();
    void on_drawColor_clicked();
    void on_tikzitFillColor_clicked();
    void on_tikzitDrawColor_clicked();

    void on_addProperty_clicked();
    void on_addAtom_clicked();
    void on_removeProperty_clicked();
    void on_propertyUp_clicked();
    void on_propertyDown_clicked();

    void on_save_clicked();

    void on_currentCategory_currentIndexChanged(int);


private:
    Ui::StyleEditor *ui;
    void setColor(QPushButton *btn, QColor col);
    void setPropertyModel(GraphElementData *d);
    QColor color(QPushButton *btn);
    QStandardItemModel *_nodeModel;
    QStandardItemModel *_edgeModel;
    QStandardItem *_activeItem;
    NodeStyle *_activeNodeStyle;
    EdgeStyle *_activeEdgeStyle;
    //QString _activeCategory;
    Style *activeStyle();
    TikzStyles *_styles;
    void updateColor(QPushButton *btn, QString name, QString propName);
    QVector<QWidget*> _formWidgets;
    bool _dirty;
};

#endif // STYLEEDITOR_H
