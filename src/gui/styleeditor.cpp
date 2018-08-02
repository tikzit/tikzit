#include <QColorDialog>
#include <QDebug>

#include "tikzit.h"
#include "styleeditor.h"
#include "ui_styleeditor.h"

StyleEditor::StyleEditor(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::StyleEditor)
{
    ui->setupUi(this);

    setColor(ui->fillColor, QColor(Qt::white));
    setColor(ui->drawColor, QColor(Qt::black));
    setColor(ui->tikzitFillColor, QColor(Qt::white));
    setColor(ui->tikzitDrawColor, QColor(Qt::black));

    TikzStyles *styles = tikzit->styles();

    _nodeModel = new QStandardItemModel(this);
    _edgeModel = new QStandardItemModel(this);

    ui->styleListView->setModel(_nodeModel);
    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(48,48));


    ui->edgeStyleListView->setModel(_edgeModel);
    ui->edgeStyleListView->setViewMode(QListView::IconMode);
    ui->edgeStyleListView->setMovement(QListView::Static);
    ui->edgeStyleListView->setGridSize(QSize(48,48));

    // setup the color dialog to display only the named colors that tikzit/xcolor knows
    // about as "standard colors".
    for (int i = 0; i < 48; ++i) {
        QColorDialog::setStandardColor(i, QColor(Qt::white));
    }

    // grayscale in column 1
    int pos = 0;
    for (int i=0; i < 5; ++i) {
        QColorDialog::setStandardColor(pos, styles->colorByIndex(i));
        pos += 1;
    }

    // rainbow in column 2
    pos = 6;
    for (int i=5; i < 11; ++i) {
        QColorDialog::setStandardColor(pos, styles->colorByIndex(i));
        pos += 1;
    }

    // brown/green/teal spectrum in column 3
    pos = 12;
    for (int i=11; i < 16; ++i) {
        QColorDialog::setStandardColor(pos, styles->colorByIndex(i));
        pos += 1;
    }

    // pinks in column 4
    pos = 18;
    for (int i=16; i < 19; ++i) {
        QColorDialog::setStandardColor(pos, styles->colorByIndex(i));
        pos += 1;
    }

    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
    updateFields();
}

StyleEditor::~StyleEditor()
{
    delete ui;
}

void StyleEditor::showEvent(QShowEvent *)
{
    tikzit->styles()->refreshModels(_nodeModel, _edgeModel);
}

void StyleEditor::updateFields()
{
    ui->name->setEnabled(false);
    ui->category->setEnabled(false);
    ui->fillColor->setEnabled(false);
    ui->drawColor->setEnabled(false);
    ui->tikzitFillColor->setEnabled(false);
    ui->tikzitDrawColor->setEnabled(false);
    ui->hasTikzitFillColor->setEnabled(false);
    ui->hasTikzitDrawColor->setEnabled(false);
    ui->shape->setEnabled(false);
    ui->hasTikzitShape->setEnabled(false);
    ui->tikzitShape->setEnabled(false);
    ui->leftArrow->setEnabled(false);
    ui->rightArrow->setEnabled(false);
    ui->properties->setEnabled(false);

    if (_activeNodeStyle != 0) {
        ui->name->setEnabled(true);
        ui->name->setText(_activeNodeStyle->name());

        ui->category->setEnabled(true);
        // TODO

        // passing 'false' to these methods prevents 'tikzit foo' from overriding property 'foo'
        QColor realFill = _activeNodeStyle->fillColor(false);
        QColor fill = _activeNodeStyle->fillColor();
        bool fillOverride = realFill != fill;
        QColor realDraw = _activeNodeStyle->strokeColor(false);
        QColor draw = _activeNodeStyle->strokeColor();
        bool drawOverride = realDraw != draw;

        ui->fillColor->setEnabled(true);
        setColor(ui->fillColor, realFill);

        ui->drawColor->setEnabled(true);
        setColor(ui->drawColor, realDraw);


        ui->hasTikzitFillColor->setEnabled(true);
        ui->hasTikzitFillColor->setChecked(fillOverride);

        ui->tikzitFillColor->setEnabled(fillOverride);
        setColor(ui->tikzitFillColor, fill);

        ui->hasTikzitDrawColor->setEnabled(true);
        ui->hasTikzitDrawColor->setChecked(drawOverride);

        ui->tikzitDrawColor->setEnabled(drawOverride);
        setColor(ui->tikzitDrawColor, draw);

        // TODO
        ui->shape->setEnabled(true);
        ui->hasTikzitShape->setEnabled(true);
        ui->tikzitShape->setEnabled(true);
        ui->properties->setEnabled(true);
    } else if (_activeEdgeStyle != 0) {
        ui->name->setEnabled(true);
        ui->name->setText(_activeEdgeStyle->name());

        ui->category->setEnabled(true);
        // TODO


        setColor(ui->fillColor, QColor(Qt::gray));
        setColor(ui->tikzitFillColor, QColor(Qt::gray));
        ui->hasTikzitFillColor->setChecked(false);


        // passing 'false' to these methods prevents 'tikzit foo' from overriding property 'foo'
        QColor realDraw = _activeEdgeStyle->strokeColor(false);
        QColor draw = _activeEdgeStyle->strokeColor();
        bool drawOverride = realDraw != draw;

        ui->drawColor->setEnabled(true);
        setColor(ui->drawColor, realDraw);

        ui->hasTikzitDrawColor->setEnabled(true);
        ui->hasTikzitDrawColor->setChecked(drawOverride);

        ui->tikzitDrawColor->setEnabled(drawOverride);
        setColor(ui->tikzitDrawColor, draw);

        // TODO
        ui->leftArrow->setEnabled(true);
        ui->rightArrow->setEnabled(true);
        ui->properties->setEnabled(true);
    } else {
        setColor(ui->fillColor, QColor(Qt::gray));
        setColor(ui->drawColor, QColor(Qt::gray));
        setColor(ui->tikzitDrawColor, QColor(Qt::gray));
        setColor(ui->tikzitFillColor, QColor(Qt::gray));
    }
}


void StyleEditor::on_fillColor_clicked()
{
    QColor col = QColorDialog::getColor(
                color(ui->fillColor),
                this,
                "Fill Color",
                QColorDialog::DontUseNativeDialog);
    if (col.isValid()) setColor(ui->fillColor, col);
}

void StyleEditor::on_styleListView_clicked()
{
    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
    const QModelIndexList i = ui->styleListView->selectionModel()->selectedIndexes();
    QString sty;
    if (!i.isEmpty()) {
        sty = i[0].data().toString();
        if (sty != "none")
            _activeNodeStyle = tikzit->styles()->nodeStyle(sty);
    }
    updateFields();
}

void StyleEditor::on_edgeStyleListView_clicked()
{
    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
    const QModelIndexList i = ui->edgeStyleListView->selectionModel()->selectedIndexes();
    QString sty;
    if (!i.isEmpty()) {
        sty = i[0].data().toString();
        if (sty != "none")
            _activeEdgeStyle = tikzit->styles()->edgeStyle(sty);
    }
    updateFields();
}

void StyleEditor::setColor(QPushButton *btn, QColor col)
{
    QPalette pal = btn->palette();
    pal.setColor(QPalette::Button, col);
    btn->setPalette(pal);
    btn->update();
}

QColor StyleEditor::color(QPushButton *btn)
{
    QPalette pal = btn->palette();
    return pal.color(QPalette::Button);
}
