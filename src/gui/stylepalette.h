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
    void clearNodeStyle();
    void toggleClearNodeStyle();
    void nextEdgeStyle();
    void previousEdgeStyle();
    void clearEdgeStyle();
    void toggleClearEdgeStyle();
    QString activeNodeStyleName();
	QString activeEdgeStyleName();
public slots:
    void nodeStyleDoubleClicked(const QModelIndex &);
    void edgeStyleDoubleClicked(const QModelIndex &);
    void on_buttonNewTikzstyles_clicked();
    void on_buttonOpenTikzstyles_clicked();
    void on_buttonEditTikzstyles_clicked();
    void on_buttonRefreshTikzstyles_clicked();
    void on_currentCategory_currentTextChanged(const QString &cat);
    //void on_buttonApplyNodeStyle_clicked();

private:
    int _lastStyleIndex;
    int _lastEdgeStyleIndex;
    int styleIndex();
    void setStyleIndex(int i);
    int edgeStyleIndex();
    void setEdgeStyleIndex(int i);

    Ui::StylePalette *ui;

protected:
    void resizeEvent(QResizeEvent *event) override;
};

#endif // STYLEPALETTE_H
