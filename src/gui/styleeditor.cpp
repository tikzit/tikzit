#include <QColorDialog>
#include <QDebug>
#include <QMessageBox>

#include "tikzit.h"
#include "styleeditor.h"
#include "ui_styleeditor.h"

StyleEditor::StyleEditor(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::StyleEditor)
{
    ui->setupUi(this);
    _formWidgets << ui->name << ui->category <<
        ui->fillColor << ui->hasTikzitFillColor << ui->tikzitFillColor <<
        ui->drawColor << ui->hasTikzitDrawColor << ui->tikzitDrawColor <<
        ui->shape << ui->hasTikzitShape << ui->tikzitShape <<
        ui->leftArrow << ui->rightArrow <<
        ui->properties;

    _styles = nullptr;

    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(48,48));

    ui->edgeStyleListView->setViewMode(QListView::IconMode);
    ui->edgeStyleListView->setMovement(QListView::Static);
    ui->edgeStyleListView->setGridSize(QSize(48,48));

    connect(ui->category->lineEdit(),
            SIGNAL(editingFinished()),
            this, SLOT(categoryChanged()));
    connect(ui->category,
            SIGNAL(currentIndexChanged(int)),
            this, SLOT(categoryChanged()));

    // setup the color dialog to display only the named colors that tikzit/xcolor knows
    // about as "standard colors".
    for (int i = 0; i < 48; ++i) {
        QColorDialog::setStandardColor(i, QColor(Qt::white));
    }

    // grayscale in column 1
    int pos = 0;
    for (int i=0; i < 5; ++i) {
        QColorDialog::setStandardColor(pos, tikzit->colorByIndex(i));
        pos += 1;
    }

    // rainbow in column 2
    pos = 6;
    for (int i=5; i < 11; ++i) {
        QColorDialog::setStandardColor(pos, tikzit->colorByIndex(i));
        pos += 1;
    }

    // brown/green/teal spectrum in column 3
    pos = 12;
    for (int i=11; i < 16; ++i) {
        QColorDialog::setStandardColor(pos, tikzit->colorByIndex(i));
        pos += 1;
    }

    // pinks in column 4
    pos = 18;
    for (int i=16; i < 19; ++i) {
        QColorDialog::setStandardColor(pos, tikzit->colorByIndex(i));
        pos += 1;
    }

    refreshDisplay();
}

StyleEditor::~StyleEditor()
{
    delete ui;
}

void StyleEditor::open() {
    if (_styles != nullptr) delete _styles;
    _styles = new TikzStyles;
    ui->styleListView->setModel(_styles->nodeStyles());
    ui->edgeStyleListView->setModel(_styles->edgeStyles());
    connect(ui->styleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(nodeItemChanged(QModelIndex)));
    connect(ui->edgeStyleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(edgeItemChanged(QModelIndex)));

    if (_styles->loadStyles(tikzit->styleFilePath())) {
        _dirty = false;
        refreshCategories();
        refreshDisplay();
        show();
    } else {
        QMessageBox::warning(0,
            "Bad style file.",
            "Bad style file: '" + tikzit->styleFile() + "'. Check that the file exists and is properly formatted.");
    }
}

void StyleEditor::closeEvent(QCloseEvent *event)
{
    if (_dirty) {
        QMessageBox::StandardButton resBtn = QMessageBox::question(
                    this, "Save Changes",
                    "Do you wish to save changes to " + tikzit->styleFile() + "?",
                    QMessageBox::Cancel | QMessageBox::No | QMessageBox::Yes,
                    QMessageBox::Yes);

        if (resBtn == QMessageBox::Yes) {
            // TODO save here
            event->accept();
        } else if (resBtn == QMessageBox::No) {
            event->accept();
        } else {
            event->ignore();
        }
    } else {
        event->accept();
    }
}

void StyleEditor::nodeItemChanged(QModelIndex sel)
{
    if (sel.isValid()) {
        ui->edgeStyleListView->selectionModel()->clear();
        qDebug() << "active style:" << ((activeStyle() == nullptr) ? "null" : activeStyle()->tikz());
        qDebug() << "style from index:" << _styles->nodeStyles()->styleInCategory(sel.row())->tikz();
    }
    _nodeStyleIndex = sel;
    refreshDisplay();
}

void StyleEditor::edgeItemChanged(QModelIndex sel)
{
    if (sel.isValid()) {
        ui->styleListView->selectionModel()->clear();
        //_nodeStyleIndex = QModelIndex();
    }
    _edgeStyleIndex = sel;
    refreshDisplay();
}

void StyleEditor::categoryChanged()
{
    Style *s = activeStyle();
    QString cat = ui->category->currentText();
    //qDebug() << "got category: " << cat;

    if (s != 0 && s->data()->property("tikzit category") != cat) {
        if (cat.isEmpty()) s->data()->unsetProperty("tikzit category");
        else s->data()->setProperty("tikzit category", cat);
        _dirty = true;
        refreshCategories();
        refreshDisplay();
    }
}

void StyleEditor::currentCategoryChanged()
{
}

void StyleEditor::refreshCategories()
{
    ui->currentCategory->blockSignals(true);
    ui->category->blockSignals(true);
    QString curCat = ui->currentCategory->currentText();
    QString cat = ui->category->currentText();
    ui->currentCategory->clear();
    ui->category->clear();

    if (_styles != nullptr) {
        foreach(QString c, _styles->categories()) {
            ui->category->addItem(c);
            ui->currentCategory->addItem(c);
        }
    }

    ui->currentCategory->setCurrentText(curCat);
    ui->category->setCurrentText(cat);
    ui->currentCategory->blockSignals(false);
    ui->category->blockSignals(false);
}

void StyleEditor::propertyChanged()
{
    QModelIndexList nSel = ui->styleListView->selectionModel()->selectedRows();
    QModelIndexList eSel = ui->edgeStyleListView->selectionModel()->selectedRows();
    if (!nSel.isEmpty()) {
        emit _styles->nodeStyles()->dataChanged(nSel[0], nSel[0]);
        refreshCategories();
    } else if (!eSel.isEmpty()) {
        emit _styles->edgeStyles()->dataChanged(eSel[0], eSel[0]);
    }
    _dirty = true;
    refreshDisplay();
}

void StyleEditor::refreshDisplay()
{
    // disable all fields and block signals while we set their values
    foreach (QWidget *w, _formWidgets) {
        w->setEnabled(false);
        w->blockSignals(true);
    }

    // set to default values
    ui->name->setText("none");
    ui->category->setCurrentText("");
    //ui->category->clear();

    setColor(ui->fillColor, QColor(Qt::gray));
    setColor(ui->drawColor, QColor(Qt::gray));
    setColor(ui->tikzitFillColor, QColor(Qt::gray));
    setColor(ui->tikzitDrawColor, QColor(Qt::gray));
    ui->hasTikzitDrawColor->setChecked(false);
    ui->hasTikzitFillColor->setChecked(false);
    ui->shape->setCurrentText("");
    ui->hasTikzitShape->setChecked(false);
    ui->tikzitShape->setCurrentText("");
    ui->leftArrow->setCurrentText("");
    ui->rightArrow->setCurrentText("");
    ui->properties->setModel(0);

    Style *s = activeStyle();

    if (s != nullptr && !s->isNone()) {
        // name
        ui->name->setEnabled(true);
        ui->name->setText(s->name());

        // property list
        ui->properties->setEnabled(true);
        setPropertyModel(s->data());

        // draw
        QColor realDraw = s->strokeColor(false);
        QColor draw = s->strokeColor();
        ui->drawColor->setEnabled(true);
        setColor(ui->drawColor, realDraw);

        // tikzit draw
        bool drawOverride = realDraw != draw;
        ui->hasTikzitDrawColor->setEnabled(true);
        ui->hasTikzitDrawColor->setChecked(drawOverride);

        ui->tikzitDrawColor->setEnabled(drawOverride);
        if (drawOverride) setColor(ui->tikzitDrawColor, draw);

        if (!s->isEdgeStyle()) {
            // category
            ui->category->setEnabled(true);
            ui->category->setCurrentText(
                s->propertyWithDefault("tikzit category", "", false));

            // fill
            QColor realFill = s->fillColor(false);
            QColor fill = s->fillColor();
            ui->fillColor->setEnabled(true);
            setColor(ui->fillColor, realFill);

            // tikzit fill
            bool fillOverride = realFill != fill;
            ui->hasTikzitFillColor->setEnabled(true);
            ui->hasTikzitFillColor->setChecked(fillOverride);
            ui->tikzitFillColor->setEnabled(fillOverride);
            if (fillOverride) setColor(ui->tikzitFillColor, fill);

            // shape
            QString realShape = s->propertyWithDefault("shape", "", false);
            QString shape = s->propertyWithDefault("tikzit shape", "", false);
            ui->shape->setEnabled(true);
            ui->shape->setCurrentText(realShape);

            // tikzit shape
            bool shapeOverride = shape != realShape;
            ui->hasTikzitShape->setEnabled(true);
            ui->tikzitShape->setEnabled(shapeOverride);
            if (shapeOverride) ui->tikzitShape->setCurrentText(shape);
        } else {
            // set fill to gray (disabled)
            setColor(ui->fillColor, QColor(Qt::gray));
            setColor(ui->tikzitFillColor, QColor(Qt::gray));
            ui->hasTikzitFillColor->setChecked(false);


            // arrow tail
            ui->leftArrow->setEnabled(true);

            switch (s->arrowTail()) {
            case Style::NoTip:
                ui->leftArrow->setCurrentText("");
                break;
            case Style::Pointer:
                ui->leftArrow->setCurrentText("<");
                break;
            case Style::Flat:
                ui->leftArrow->setCurrentText("|");
                break;
            }

            // arrow head
            ui->rightArrow->setEnabled(true);
            switch (s->arrowHead()) {
            case Style::NoTip:
                ui->rightArrow->setCurrentText("");
                break;
            case Style::Pointer:
                ui->rightArrow->setCurrentText(">");
                break;
            case Style::Flat:
                ui->rightArrow->setCurrentText("|");
                break;
            }
        }

    } else {
        setColor(ui->fillColor, QColor(Qt::gray));
        setColor(ui->drawColor, QColor(Qt::gray));
        setColor(ui->tikzitDrawColor, QColor(Qt::gray));
        setColor(ui->tikzitFillColor, QColor(Qt::gray));
    }

    // unblock signals so we are ready for user input
    foreach (QWidget *w, _formWidgets) {
        w->blockSignals(false);
    }
}

void StyleEditor::on_fillColor_clicked()
{
    updateColor(ui->fillColor, "Fill Color", "fill");
}

void StyleEditor::on_drawColor_clicked()
{
    updateColor(ui->drawColor, "Draw Color", "draw");
}

void StyleEditor::on_tikzitFillColor_clicked()
{
    updateColor(ui->tikzitFillColor, "TikZiT Fill Color", "tikzit fill");
}

void StyleEditor::on_tikzitDrawColor_clicked()
{
    updateColor(ui->tikzitDrawColor, "TikZiT Draw Color", "tikzit draw");
}

void StyleEditor::on_addProperty_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        s->data()->add(GraphElementProperty("new property", ""));
        _dirty = true;
    }
}

void StyleEditor::on_addAtom_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        s->data()->add(GraphElementProperty("new atom"));
        _dirty = true;
    }
}

void StyleEditor::on_removeProperty_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        QModelIndexList sel = ui->properties->selectionModel()->selectedRows();
        if (!sel.isEmpty()) {
            s->data()->removeRows(sel[0].row(), 1, sel[0].parent());
            _dirty = true;
        }
    }
}

void StyleEditor::on_propertyUp_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        QModelIndexList sel = ui->properties->selectionModel()->selectedRows();
        if (!sel.isEmpty()) {
            s->data()->moveRows(
                    sel[0].parent(),
                    sel[0].row(), 1,
                    sel[0].parent(),
                    sel[0].row() - 1);
            _dirty = true;
        }
    }
}

void StyleEditor::on_propertyDown_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        QModelIndexList sel = ui->properties->selectionModel()->selectedRows();
        if (!sel.isEmpty()) {
            s->data()->moveRows(
                    sel[0].parent(),
                    sel[0].row(), 1,
                    sel[0].parent(),
                    sel[0].row() + 2);
            _dirty = true;
        }
    }
}

void StyleEditor::on_save_clicked()
{
    save();
    close();
}

void StyleEditor::on_currentCategory_currentIndexChanged(int)
{
    currentCategoryChanged();
}


void StyleEditor::save()
{
    QString p = tikzit->styleFilePath();

    if (_styles->saveStyles(p)) {
        _dirty = false;
        tikzit->loadStyles(p);
    } else {
        QMessageBox::warning(0,
            "Unabled to save style file",
            "Unable to write to file: '" + tikzit->styleFile() + "'.");
    }
}

void StyleEditor::on_styleListView_clicked()
{
}

void StyleEditor::on_edgeStyleListView_clicked()
{
}

void StyleEditor::on_name_editingFinished()
{
    Style *s = activeStyle();

    if (s != 0) {
        s->setName(ui->name->text());
        refreshActiveStyle();
//        refreshDisplay();
        _dirty = true;
    }
}

void StyleEditor::on_shape_currentTextChanged()
{
    Style *s = activeStyle();
    if (s != 0) {
        s->data()->setProperty("shape", ui->shape->currentText());
        refreshActiveStyle();
//        refreshDisplay();
        _dirty = true;
    }
}

void StyleEditor::setColor(QPushButton *btn, QColor col)
{
    QPalette pal = btn->palette();
    pal.setColor(QPalette::Button, col);
    btn->setPalette(pal);
    btn->update();
}

void StyleEditor::setPropertyModel(GraphElementData *d)
{
    if (ui->properties->model() != 0) {
        disconnect(ui->properties->model(), SIGNAL(dataChanged(QModelIndex,QModelIndex,QVector<int>)),
                   this, SLOT(propertyChanged()));
    }
    ui->properties->setModel(d);
    connect(d, SIGNAL(dataChanged(QModelIndex,QModelIndex,QVector<int>)),
            this, SLOT(propertyChanged()));
}

QColor StyleEditor::color(QPushButton *btn)
{
    QPalette pal = btn->palette();
    return pal.color(QPalette::Button);
}

Style *StyleEditor::activeStyle()
{
    if (_styles != nullptr) {
        if (_nodeStyleIndex.isValid())
            return _styles->nodeStyles()->styleInCategory(_nodeStyleIndex.row());

        if (_edgeStyleIndex.isValid())
            return _styles->edgeStyles()->styleInCategory(_edgeStyleIndex.row());
    }

    return nullptr;
}

void StyleEditor::refreshActiveStyle()
{
    if (_styles != nullptr) {
        if (_nodeStyleIndex.isValid())
            emit _styles->nodeStyles()->dataChanged(_nodeStyleIndex, _nodeStyleIndex);

        if (_edgeStyleIndex.isValid())
            emit _styles->edgeStyles()->dataChanged(_edgeStyleIndex, _edgeStyleIndex);
    }
}

void StyleEditor::updateColor(QPushButton *btn, QString name, QString propName)
{
    QColor col = QColorDialog::getColor(
                color(btn),
                this,
                name,
                QColorDialog::DontUseNativeDialog);
    setColor(btn, col);
    Style *s = activeStyle();
    if (s != nullptr) {
        s->data()->setProperty(propName, tikzit->nameForColor(col));
        refreshActiveStyle();
//        refreshDisplay();
        _dirty = true;
    }
}
