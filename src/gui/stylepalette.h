/*
    TikZiT - a GUI diagram editor for TikZ
    Copyright (C) 2018 Aleks Kissinger

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
	QString activeEdgeStyleName();


public slots:
    void nodeStyleDoubleClicked(const QModelIndex &index);
    void edgeStyleDoubleClicked(const QModelIndex &index);
    void on_buttonOpenTikzstyles_clicked();
    void on_buttonEditTikzstyles_clicked();
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
