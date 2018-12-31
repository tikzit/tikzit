#include "exportdialog.h"
#include "ui_exportdialog.h"

#include "tikzit.h"

ExportDialog::ExportDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::ExportDialog)
{
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
}

ExportDialog::~ExportDialog()
{
    delete ui;
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

}

void ExportDialog::on_fileFormat_currentIndexChanged(int f)
{
    ui->width->setEnabled(f != PDF);
    ui->height->setEnabled(f != PDF);
}
