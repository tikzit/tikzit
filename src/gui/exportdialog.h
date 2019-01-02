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

/*!
 * A dialog for exporting a LaTeX-generated preview to PNG, JPG, or PDF.
 */

#ifndef EXPORTDIALOG_H
#define EXPORTDIALOG_H

#include <QDialog>

namespace Ui {
class ExportDialog;
}

class ExportDialog : public QDialog
{
    Q_OBJECT

public:
    explicit ExportDialog(QWidget *parent = nullptr);
    ~ExportDialog() override;
    enum Format {
        PNG = 0,
        JPG = 1,
        PDF = 2
    };
    QString filePath();
    QSize size();
    Format fileFormat();
public slots:
    void accept() override;

protected slots:
    void setHeightFromWidth();
    void setWidthFromHeight();
    void on_keepAspect_stateChanged(int state);
    void on_browseButton_clicked();
    void on_fileFormat_currentIndexChanged(int f);

private:
    Ui::ExportDialog *ui;
};

#endif // EXPORTDIALOG_H
