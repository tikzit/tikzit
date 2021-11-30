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
 * Displays a LaTeX-generated PDF preview using Poppler. The right-click
 * menu has options for exporting to file or clipboard.
 */

#ifndef PREVIEWWINDOW_H
#define PREVIEWWINDOW_H

#include "pdfdocument.h"

#include <QDialog>
#include <QLabel>
#include <QPlainTextEdit>
#include <QContextMenuEvent>

namespace Ui {
class PreviewWindow;
}

class PreviewWindow : public QDialog
{
    Q_OBJECT

public:
    enum Status {
        Running, Success, Failed
    };
    explicit PreviewWindow(QWidget *parent = nullptr);
    ~PreviewWindow() override;
    void restorePosition();
    void setPdf(QString file);
    QString preparePreview(QString tikz);
    QPlainTextEdit *outputTextEdit();
    void setStatus(Status status);

    PdfDocument *doc() const;

public slots:
    void render();
    void exportImage();
    void copyImageToClipboard();

protected:
    void resizeEvent(QResizeEvent *e) override;
    void showEvent(QShowEvent *e) override;
    void closeEvent(QCloseEvent *e) override;
    void contextMenuEvent(QContextMenuEvent *event) override;
private:
    Ui::PreviewWindow *ui;
    PdfDocument *_doc;
    QLabel *_loader;
    bool _positionRestored;
};

#endif // PREVIEWWINDOW_H
