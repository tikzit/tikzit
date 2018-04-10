#ifndef STYLEPALETTE_H
#define STYLEPALETTE_H

#include <QDockWidget>
#include <QStandardItemModel>

namespace Ui {
class StylePalette;
}

class StylePalette : public QDockWidget
{
    Q_OBJECT

public:
    explicit StylePalette(QWidget *parent = 0);
    ~StylePalette();
    void reloadStyles();
    void nextNodeStyle();
    void previousNodeStyle();
    QString activeNodeStyleName();


public slots:
    void nodeStyleDoubleClicked(const QModelIndex &index);
    void edgeStyleDoubleClicked(const QModelIndex &index);
    void on_buttonOpenTikzstyles_clicked();
    void on_buttonRefreshTikzstyles_clicked();
    //void on_buttonApplyNodeStyle_clicked();

private:
    void changeNodeStyle(int increment);

    Ui::StylePalette *ui;
    QStandardItemModel *_nodeModel;
    QStandardItemModel *_edgeModel;

protected:
    void closeEvent(QCloseEvent *event) override;
};

#endif // STYLEPALETTE_H
