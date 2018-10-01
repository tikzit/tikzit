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

    _styles = 0;

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

    connect(ui->styleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(nodeItemChanged(QModelIndex)));
    connect(ui->edgeStyleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(edgeItemChanged(QModelIndex)));
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

    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
	_activeItem = 0;
    refreshDisplay();
}

StyleEditor::~StyleEditor()
{
    delete ui;
}

void StyleEditor::open() {
    if (_styles != 0) delete _styles;
    _styles = new TikzStyles;
    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
    _activeItem = 0;
    ui->styleListView->selectionModel()->clear();
    ui->edgeStyleListView->selectionModel()->clear();
    if (_styles->loadStyles(tikzit->styleFilePath())) {
        _dirty = false;
        _styles->refreshModels(_nodeModel, _edgeModel, "", false);
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
    //ui->edgeStyleListView->blockSignals(true);
    ui->edgeStyleListView->selectionModel()->clear();
    //ui->edgeStyleListView->blockSignals(false);
    //qDebug() << "got node item change";

    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
	_activeItem = 0;
    QString sty;
    if (sel.isValid()) {
        _activeItem = _nodeModel->itemFromIndex(sel);
        sty = _activeItem->text();
        if (sty != "none")
            _activeNodeStyle = _styles->nodeStyle(sty);
    }
    refreshDisplay();
}

void StyleEditor::edgeItemChanged(QModelIndex sel)
{
    //ui->styleListView->blockSignals(true);
    ui->styleListView->selectionModel()->clear();
    //ui->styleListView->blockSignals(false);
    //qDebug() << "got edge item change";

    _activeNodeStyle = 0;
    _activeEdgeStyle = 0;
	_activeItem = 0;

    QString sty;
    if (sel.isValid()) {
        _activeItem = _edgeModel->itemFromIndex(sel);
        sty = _activeItem->text();
        if (sty != "none")
            _activeEdgeStyle = _styles->edgeStyle(sty);
    }
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
    qDebug() << "refreshing models on category change";
    _styles->refreshModels(_nodeModel, _edgeModel, ui->currentCategory->currentText(), false);
    _activeItem = 0;

    // try to keep the selection as is, or clear the current style
    if (_activeNodeStyle != 0) {
        ui->styleListView->selectionModel()->clear();
        for (int i = 0; i < _nodeModel->rowCount(); ++i) {
            if (_activeNodeStyle->name() == _nodeModel->item(i)->data()) {
                _activeItem = _nodeModel->item(i);
                ui->styleListView->selectionModel()->select(
                            _nodeModel->index(i,0),
                            QItemSelectionModel::SelectCurrent);
            }
        }
    } else if (_activeEdgeStyle != 0) {
        ui->edgeStyleListView->selectionModel()->clear();
        for (int i = 0; i < _edgeModel->rowCount(); ++i) {
            if (_activeEdgeStyle->name() == _edgeModel->item(i)->data()) {
                _activeItem = _edgeModel->item(i);
                ui->edgeStyleListView->selectionModel()->select(
                            _edgeModel->index(i,0),
                            QItemSelectionModel::SelectCurrent);
            }
        }
    }

    if (_activeItem == 0) {
        _activeNodeStyle = 0;
        _activeEdgeStyle = 0;
    }
}

void StyleEditor::refreshCategories()
{
    ui->currentCategory->blockSignals(true);
    ui->category->blockSignals(true);
    QString curCat = ui->currentCategory->currentText();
    QString cat = ui->category->currentText();
    ui->currentCategory->clear();
    ui->category->clear();

    if (_styles != 0) {
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
    if (_activeNodeStyle != 0) {
        _activeItem->setIcon(_activeNodeStyle->icon());
        refreshCategories();
    } else if (_activeEdgeStyle != 0) {
        _activeItem->setIcon(_activeEdgeStyle->icon());
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

    if (_activeNodeStyle != 0) {
        //_activeItem->setText(_activeNodeStyle->name());
        //_activeItem->setIcon(_activeNodeStyle->icon());

        ui->name->setEnabled(true);
        ui->name->setText(_activeNodeStyle->name());

        ui->category->setEnabled(true);
        ui->category->setCurrentText(
            _activeNodeStyle->propertyWithDefault("tikzit category", "", false));

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
        if (fillOverride) setColor(ui->tikzitFillColor, fill);

        ui->hasTikzitDrawColor->setEnabled(true);
        ui->hasTikzitDrawColor->setChecked(drawOverride);

        ui->tikzitDrawColor->setEnabled(drawOverride);
        if (drawOverride) setColor(ui->tikzitDrawColor, draw);

        QString realShape = _activeNodeStyle->propertyWithDefault("shape", "", false);
        QString shape = _activeNodeStyle->propertyWithDefault("tikzit shape", "", false);
        bool shapeOverride = shape != realShape;
        ui->shape->setEnabled(true);
        ui->shape->setCurrentText(realShape);

        ui->hasTikzitShape->setEnabled(true);
        ui->tikzitShape->setEnabled(shapeOverride);
        if (shapeOverride) ui->tikzitShape->setCurrentText(shape);

        ui->properties->setEnabled(true);
        setPropertyModel(_activeNodeStyle->data());
        qDebug() << _activeNodeStyle->data()->tikz();
    } else if (_activeEdgeStyle != 0) {
        //_activeItem->setText(_activeEdgeStyle->name());
        //_activeItem->setIcon(_activeEdgeStyle->icon());
        ui->name->setEnabled(true);
        ui->name->setText(_activeEdgeStyle->name());

        //ui->category->setEnabled(true);
        //ui->category->setCurrentText(
        //    _activeEdgeStyle->propertyWithDefault("tikzit category", "", false));

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

        ui->leftArrow->setEnabled(true);

        switch (_activeEdgeStyle->arrowTail()) {
        case EdgeStyle::NoTip:
            ui->leftArrow->setCurrentText("");
            break;
        case EdgeStyle::Pointer:
            ui->leftArrow->setCurrentText("<");
            break;
        case EdgeStyle::Flat:
            ui->leftArrow->setCurrentText("|");
            break;
        }

        ui->rightArrow->setEnabled(true);
        switch (_activeEdgeStyle->arrowHead()) {
        case EdgeStyle::NoTip:
            ui->rightArrow->setCurrentText("");
            break;
        case EdgeStyle::Pointer:
            ui->rightArrow->setCurrentText(">");
            break;
        case EdgeStyle::Flat:
            ui->rightArrow->setCurrentText("|");
            break;
        }

        ui->properties->setEnabled(true);
        setPropertyModel(_activeEdgeStyle->data());
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
        _activeItem->setText(ui->name->text());
        refreshDisplay();
        _dirty = true;
    }
}

void StyleEditor::on_shape_currentTextChanged()
{
    if (_activeNodeStyle != 0) {
        _activeNodeStyle->data()->setProperty("shape", ui->shape->currentText());
        _activeItem->setIcon(_activeNodeStyle->icon());
        refreshDisplay();
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
    if (_activeNodeStyle != 0) return _activeNodeStyle;
    else return _activeEdgeStyle;
}

void StyleEditor::updateColor(QPushButton *btn, QString name, QString propName)
{
    QColor col = QColorDialog::getColor(
                color(btn),
                this,
                name,
                QColorDialog::DontUseNativeDialog);
    if (col.isValid()) {
        setColor(btn, col);
        if (_activeNodeStyle != 0) {
            _activeNodeStyle->data()->setProperty(propName, tikzit->nameForColor(col));
            _activeItem->setIcon(_activeNodeStyle->icon());
        } else if (_activeEdgeStyle != 0) {
            _activeEdgeStyle->data()->setProperty(propName, tikzit->nameForColor(col));
            _activeItem->setIcon(_activeEdgeStyle->icon());
        }

        refreshDisplay();
        _dirty = true;
    }
}
