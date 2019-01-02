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

#include "exportdialog.h"
#include "ui_exportdialog.h"

#include "tikzit.h"

#include <QFileDialog>
#include <QSettings>
#include <QStandardPaths>

ExportDialog::ExportDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::ExportDialog)
{
    QSettings settings("tikzit", "tikzit");
    ui->setupUi(this);

    QIntValidator *v = new QIntValidator(this);
    v->setBottom(1);
    ui->width->setValidator(v);
    ui->height->setValidator(v);
    connect(ui->width, SIGNAL(editingFinished()),
            this, SLOT(setHeightFromWidth()));
    connect(ui->height, SIGNAL(editingFinished()),
            this, SLOT(setWidthFromHeight()));

    PdfDocument *doc = tikzit->previewWindow()->doc();
    if (doc) {
        QSize size = doc->size() * 4;
        ui->width->blockSignals(true);
        ui->height->blockSignals(true);
        ui->width->setText(QString::number(size.width()));
        ui->height->setText(QString::number(size.height()));
        ui->width->blockSignals(false);
        ui->height->blockSignals(false);
    }

    if (!settings.value("previous-export-file-format").isNull()) {
        ui->fileFormat->setCurrentIndex(settings.value("previous-export-file-format").toInt());
    }

    // set a default export file
    QString path = (!settings.value("previous-export-file-path").isNull()) ?
        settings.value("previous-export-file-path").toString() :
        QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation);

    QString suffix;
    switch (ui->fileFormat->currentIndex()) {
        case PNG: suffix = ".png"; break;
        case JPG: suffix = ".jpg"; break;
        case PDF: suffix = ".pdf"; break;
    }

    QString fileName;
    int i = 0;
    bool exists = true;
    while (exists) {
        fileName = path + "/tikzit_image" + QString::number(i) + suffix;
        exists = QFileInfo::exists(fileName);
        ++i;
    }
    ui->filePath->setText(QDir::toNativeSeparators(fileName));
}

ExportDialog::~ExportDialog()
{
    delete ui;
}

QString ExportDialog::filePath()
{
    return ui->filePath->text();
}

QSize ExportDialog::size()
{
    return QSize(ui->width->text().toInt(),
                 ui->height->text().toInt());
}

ExportDialog::Format ExportDialog::fileFormat()
{
    return static_cast<Format>(ui->fileFormat->currentIndex());
}

void ExportDialog::accept()
{
    QSettings settings("tikzit", "tikzit");
    QFileInfo fi(filePath());
    settings.setValue("previous-export-file-path", fi.absolutePath());
    settings.setValue("previous-export-file-format", fileFormat());
    QDialog::accept();
}

void ExportDialog::setHeightFromWidth()
{
    if (ui->keepAspect->isChecked()) {
        PdfDocument *doc = tikzit->previewWindow()->doc();
        if (doc == nullptr || doc->size().width() == 0 || doc->size().height() == 0) return;
        int w = ui->width->text().toInt();
        int h = (w * doc->size().height()) / doc->size().width();

        ui->height->blockSignals(true);
        ui->height->setText(QString::number(h));
        ui->height->blockSignals(false);
    }
}

void ExportDialog::setWidthFromHeight()
{
    if (ui->keepAspect->isChecked()) {
        PdfDocument *doc = tikzit->previewWindow()->doc();
        if (doc == nullptr || doc->size().width() == 0 || doc->size().height() == 0) return;
        int h = ui->height->text().toInt();
        int w = (h * doc->size().width()) / doc->size().height();

        ui->width->blockSignals(true);
        ui->width->setText(QString::number(w));
        ui->width->blockSignals(false);
    }
}

void ExportDialog::on_keepAspect_stateChanged(int state)
{
    if (state == Qt::Checked) setHeightFromWidth();
}

void ExportDialog::on_browseButton_clicked()
{
    QSettings settings("tikzit", "tikzit");

    QString suffix;
    switch (ui->fileFormat->currentIndex()) {
        case PNG: suffix = "png"; break;
        case JPG: suffix = "jpg"; break;
        case PDF: suffix = "pdf"; break;
    }

    QFileDialog dialog;
    dialog.setDefaultSuffix(suffix);
    dialog.setWindowTitle(tr("Export File Path"));
    dialog.setAcceptMode(QFileDialog::AcceptSave);
    dialog.setNameFilter(ui->fileFormat->currentText());
    dialog.setFileMode(QFileDialog::AnyFile);
    dialog.setLabelText(QFileDialog::Accept, "Select");

    QFileInfo fi(ui->filePath->text());
    if (!fi.absolutePath().isEmpty()) {
        dialog.setDirectory(fi.absolutePath());
        dialog.selectFile(fi.baseName());
    }

    dialog.setOption(QFileDialog::DontUseNativeDialog);

    if (dialog.exec()) {
        ui->filePath->setText(QDir::toNativeSeparators(dialog.selectedFiles()[0]));
    }
}

void ExportDialog::on_fileFormat_currentIndexChanged(int f)
{
    ui->width->setEnabled(f != PDF);
    ui->height->setEnabled(f != PDF);
    ui->keepAspect->setEnabled(f != PDF);

    QString path = ui->filePath->text();
    if (!path.isEmpty()) {
        QRegularExpression re("\\.[^.]*$");
        switch (f) {
            case PNG: path.replace(re, ".png"); break;
            case JPG: path.replace(re, ".jpg"); break;
            case PDF: path.replace(re, ".pdf"); break;
        }

        ui->filePath->setText(path);
    }
}
