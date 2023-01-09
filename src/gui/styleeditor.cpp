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

#include <QColorDialog>
#include <QDebug>
#include <QMessageBox>
#include <QSettings>

#include "tikzit.h"
#include "styleeditor.h"
#include "delimitedstringvalidator.h"
#include "ui_styleeditor.h"
#include "delimitedstringitemdelegate.h"

StyleEditor::StyleEditor(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::StyleEditor)
{
    ui->setupUi(this);
    QSettings settings("tikzit", "tikzit");
    bool ok;
    int space = settings.value("style-icon-spacing").toInt(&ok);
    if (!ok) space = 48;

    _formWidgets << ui->name << ui->category <<
        ui->fillColor << ui->noFill << ui->hasTikzitFillColor << ui->tikzitFillColor <<
        ui->drawColor << ui->noDraw << ui->hasTikzitDrawColor << ui->tikzitDrawColor <<
        ui->shape << ui->hasTikzitShape << ui->tikzitShape <<
        ui->leftArrow << ui->rightArrow <<
        ui->properties;

    DelimitedStringValidator *v = new DelimitedStringValidator(this);
    ui->name->setValidator(v);
    ui->category->lineEdit()->setValidator(v);
    ui->shape->lineEdit()->setValidator(v);

    DelimitedStringItemDelegate *delegate = new DelimitedStringItemDelegate(ui->properties);
    ui->properties->setItemDelegate(delegate);

    setWindowIcon(QIcon(":/images/tikzit.png"));
    _styles = nullptr;
    _activeStyle = nullptr;

    ui->styleListView->setViewMode(QListView::IconMode);
    ui->styleListView->setMovement(QListView::Static);
    ui->styleListView->setGridSize(QSize(space,space));

    ui->edgeStyleListView->setViewMode(QListView::IconMode);
    ui->edgeStyleListView->setMovement(QListView::Static);
    ui->edgeStyleListView->setGridSize(QSize(space,space));

    QList<int> sizes;
    sizes << 100 << 400;
    ui->splitter->setSizes(sizes);

    connect(ui->category->lineEdit(),
            SIGNAL(editingFinished()),
            this, SLOT(categoryChanged()));
    connect(ui->category,
            SIGNAL(currentIndexChanged(int)),
            this, SLOT(categoryChanged()));

    connect(ui->shape->lineEdit(),
            SIGNAL(editingFinished()),
            this, SLOT(shapeChanged()));
    connect(ui->shape,
            SIGNAL(currentIndexChanged(int)),
            this, SLOT(shapeChanged()));

    refreshDisplay();
}

StyleEditor::~StyleEditor()
{
    delete ui;
}

void StyleEditor::open() {
    if (_styles != nullptr) delete _styles;
    _styles = new TikzStyles;
    _activeStyle = nullptr;
    ui->styleListView->setModel(_styles->nodeStyles());
    ui->edgeStyleListView->setModel(_styles->edgeStyles());
    connect(ui->styleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(nodeItemChanged(QModelIndex)));
    connect(ui->edgeStyleListView->selectionModel(),
            SIGNAL(currentChanged(QModelIndex,QModelIndex)),
            this, SLOT(edgeItemChanged(QModelIndex)));

    if (_styles->loadStyles(tikzit->styleFilePath())) {
        _canParse = true;
        setDirty(false);
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
    if (dirty()) {
        QMessageBox::StandardButton resBtn = QMessageBox::question(
                    this, "Save Changes",
                    "Do you wish to save changes to " + tikzit->styleFile() + "?",
                    QMessageBox::Cancel | QMessageBox::No | QMessageBox::Yes,
                    QMessageBox::Yes);

        if (resBtn == QMessageBox::Yes) {
            if (save()){
                event->accept();
            } else {
                event->ignore();
            }
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
    //qDebug() << "nodeItemChanged, new index:" << sel.row();
    if (sel.isValid()) {
        ui->edgeStyleListView->selectionModel()->clear();
        _activeStyle = _styles->nodeStyles()->styleInCategory(sel.row());
    }
    _nodeStyleIndex = sel;
    refreshDisplay();
}

void StyleEditor::edgeItemChanged(QModelIndex sel)
{
    if (sel.isValid()) {
        ui->styleListView->selectionModel()->clear();
        _activeStyle = _styles->edgeStyles()->styleInCategory(sel.row());
    }
    _edgeStyleIndex = sel;
    refreshDisplay();
}

void StyleEditor::categoryChanged()
{
    Style *s = activeStyle();
    QString cat = ui->category->currentText();
    //qDebug() << "got category: " << cat;

    if (s != nullptr && s->data()->property("tikzit category") != cat) {
        if (cat.isEmpty()) s->data()->unsetProperty("tikzit category");
        else s->data()->setProperty("tikzit category", cat);
        setDirty(true);
        refreshCategories();

        if (_styles->nodeStyles()->category() != "") {
            ui->currentCategory->setCurrentText(cat);
            //qDebug() << "after cat change, cat reports:" << _styles->nodeStyles()->category();
        }
        //refreshDisplay();
    }
}

void StyleEditor::currentCategoryChanged()
{
    if (_styles != nullptr) {
        QString cat = ui->currentCategory->currentText();
        if (cat != _styles->nodeStyles()->category()) {
            ui->styleListView->selectionModel()->clear();
            _styles->nodeStyles()->setCategory(cat);

            if (_activeStyle != nullptr && !_activeStyle->isEdgeStyle()) {
                for (int i = 0; i < _styles->nodeStyles()->numInCategory(); ++i) {
                    if (_styles->nodeStyles()->styleInCategory(i) == _activeStyle) {
                        ui->styleListView->selectionModel()->setCurrentIndex(
                                    _styles->nodeStyles()->index(i),
                                    QItemSelectionModel::ClearAndSelect);
                        break;
                    }
                }
                if (!_nodeStyleIndex.isValid()) _activeStyle = nullptr;
            }
        }
    }
}

void StyleEditor::shapeChanged()
{
    Style *s = activeStyle();
    if (s != 0) {
        s->data()->setProperty("shape", ui->shape->currentText());
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
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
    if (_nodeStyleIndex.isValid()) {
        emit _styles->nodeStyles()->dataChanged(_nodeStyleIndex, _nodeStyleIndex);

        if (_activeStyle->category() != _styles->nodeStyles()->category()) {
            refreshCategories();
            if (_styles->nodeStyles()->category() != "")
                ui->currentCategory->setCurrentText(_activeStyle->category());
        }
    } else if (_edgeStyleIndex.isValid()) {
        emit _styles->edgeStyles()->dataChanged(_edgeStyleIndex, _edgeStyleIndex);
    }
    setDirty(true);
    refreshDisplay();
}

void StyleEditor::refreshDisplay()
{
    // enable all fields and block signals while we set their values
    foreach (QWidget *w, _formWidgets) {
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

//    qDebug() << "style" << s;
    if (s != nullptr && !s->isNone()) {
//        qDebug() << "non-null style update";

        // name
        ui->name->setEnabled(true);
        ui->name->setText(s->name());

        // property list
        ui->properties->setEnabled(true);
        setPropertyModel(s->data());

        // draw
        QColor realDraw = s->strokeColor(false);
        QColor draw = s->strokeColor();

        ui->noDraw->setEnabled(true);
        if (s->hasStroke()) {
            ui->drawColor->setEnabled(true);
            setColor(ui->drawColor, realDraw);
            ui->noDraw->setChecked(false);
        } else {
            ui->noDraw->setChecked(true);
            ui->drawColor->setEnabled(false);
        }

        // tikzit draw
        bool drawOverride = s->data()->hasProperty("tikzit draw");
        ui->hasTikzitDrawColor->setEnabled(true);
        ui->hasTikzitDrawColor->setChecked(drawOverride);

        ui->tikzitDrawColor->setEnabled(drawOverride);
        if (drawOverride) setColor(ui->tikzitDrawColor, draw);

        // fill
        QColor realFill = s->fillColor(false);
        QColor fill = s->fillColor();

        ui->noFill->setEnabled(true);
        if (s->hasFill()) {
            ui->fillColor->setEnabled(true);
            setColor(ui->fillColor, realFill);
            ui->noFill->setChecked(false);
        } else {
            ui->noFill->setChecked(true);
            ui->fillColor->setEnabled(false);
        }

        // tikzit fill
        bool fillOverride = s->data()->hasProperty("tikzit fill");
        ui->hasTikzitFillColor->setEnabled(true);
        ui->hasTikzitFillColor->setChecked(fillOverride);
        ui->tikzitFillColor->setEnabled(fillOverride);
        if (fillOverride) setColor(ui->tikzitFillColor, fill);

        if (!s->isEdgeStyle()) {
//            qDebug() << "node style update";
            // category
            ui->category->setEnabled(true);
            ui->category->setCurrentText(
                s->propertyWithDefault("tikzit category", "", false));

            // shape
            QString realShape = s->propertyWithDefault("shape", "", false);
            QString shape = s->propertyWithDefault("tikzit shape", "", false);
            ui->shape->setEnabled(true);
            ui->shape->setCurrentText(realShape);

            // tikzit shape
            bool shapeOverride = s->data()->hasProperty("tikzit shape");
            ui->hasTikzitShape->setEnabled(true);
            ui->hasTikzitShape->setChecked(shapeOverride);
            ui->tikzitShape->setEnabled(shapeOverride);
            if (shapeOverride) ui->tikzitShape->setCurrentText(shape);
        } else {
            ui->shape->setEnabled(false);
            ui->tikzitShape->setEnabled(false);
            ui->hasTikzitShape->setEnabled(false);


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
//        qDebug() << "null style update";

        foreach (QWidget *w, _formWidgets) {
            w->setEnabled(false);
        }
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

void StyleEditor::on_hasTikzitFillColor_stateChanged(int state)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        if (state == Qt::Checked) s->data()->setProperty("tikzit fill", s->data()->property("fill"));
        else s->data()->unsetProperty("tikzit fill");
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_hasTikzitDrawColor_stateChanged(int state)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        if (state == Qt::Checked) s->data()->setProperty("tikzit draw", s->data()->property("draw"));
        else s->data()->unsetProperty("tikzit draw");
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_noFill_stateChanged(int state)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        if (state == Qt::Checked) s->data()->setProperty("fill", "none");
        else s->data()->setProperty("fill", "white");
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_noDraw_stateChanged(int state)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        if (state == Qt::Checked) s->data()->setProperty("draw", "none");
        else s->data()->setProperty("draw", "black");
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_hasTikzitShape_stateChanged(int state)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        if (state == Qt::Checked) s->data()->setProperty("tikzit shape", s->data()->property("shape"));
        else s->data()->unsetProperty("tikzit shape");
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_tikzitShape_currentIndexChanged(int)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        s->data()->setProperty("tikzit shape", ui->tikzitShape->currentText());
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_leftArrow_currentIndexChanged(int)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        s->setArrowAtom(ui->leftArrow->currentText() + "-" +
                        ui->rightArrow->currentText());
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_rightArrow_currentIndexChanged(int)
{
    Style *s = activeStyle();
    if (s != nullptr) {
        s->setArrowAtom(ui->leftArrow->currentText() + "-" +
                        ui->rightArrow->currentText());
        refreshActiveStyle();
        refreshDisplay();
        setDirty(true);
    }
}

void StyleEditor::on_addProperty_clicked()
{
    Style *s = activeStyle();
    if (s != nullptr) {
        s->data()->add(GraphElementProperty("new property", ""));
        setDirty(true);
    }
}

void StyleEditor::on_addAtom_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        s->data()->add(GraphElementProperty("new atom"));
        setDirty(true);
    }
}

void StyleEditor::on_removeProperty_clicked()
{
    Style *s = activeStyle();
    if (s != 0) {
        QModelIndexList sel = ui->properties->selectionModel()->selectedRows();
        if (!sel.isEmpty()) {
            s->data()->removeRows(sel[0].row(), 1, sel[0].parent());
            setDirty(true);
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
            setDirty(true);
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
            setDirty(true);
        }
    }
}

void StyleEditor::on_addStyle_clicked()
{
    int i = 0;

    // get a fresh name
    QString name;
    while (true) {
        name = QString("new style ") + QString::number(i);
        if (_styles->nodeStyles()->style(name) == nullptr) break;
        ++i;
    }

    // add the style to the current category
    Style *s;
    if (_styles->nodeStyles()->category() == "") {
        s = new Style(name, new GraphElementData({
          GraphElementProperty("fill", "white"),
          GraphElementProperty("draw", "black"),
          GraphElementProperty("shape", "circle")
        }));
    } else {
        s = new Style(name, new GraphElementData({
          GraphElementProperty("fill", "white"),
          GraphElementProperty("draw", "black"),
          GraphElementProperty("shape", "circle"),
          GraphElementProperty("category", _styles->nodeStyles()->category()),
        }));
    }
    _styles->nodeStyles()->addStyle(s);

    // set dirty flag and select the newly-added style
    setDirty(true);
    selectNodeStyle(_styles->nodeStyles()->numInCategory()-1);
}

void StyleEditor::on_removeStyle_clicked()
{
    if (_nodeStyleIndex.isValid()) {
        int i = _nodeStyleIndex.row();
        if (i > 0) {
            ui->styleListView->selectionModel()->clear();
            _styles->nodeStyles()->removeNthStyle(i);
            setDirty(true);
            if (i < _styles->nodeStyles()->numInCategory()) {
                selectNodeStyle(i);
            }
        }
    }
}

void StyleEditor::on_duplicateStyle_clicked()
{
    if (! _activeStyle->isEdgeStyle()){
        // get a fresh name
        QString name;
        QStringList list = _activeStyle->name().split(" ");
        bool is_last_int;
        int last = list.last().toInt(&is_last_int, 10);
        if (is_last_int){
            list.pop_back();
            while (true) {
                name = list.join(" ") + " " + QString::number(last);
                if (_styles->nodeStyles()->style(name) == nullptr) break;
                ++last;
            }
        } else {
            last = 1;
        }
        name = list.join(" ") + " " + QString::number(last);

        // add the style to the current category
        Style *s = new Style(name, _activeStyle->data()->copy());
        _styles->nodeStyles()->addStyle(s);

        // set dirty flag and select the newly-added style
        setDirty(true);
        selectNodeStyle(_styles->nodeStyles()->numInCategory()-1);
    }
}

void StyleEditor::on_styleUp_clicked()
{
    if (_nodeStyleIndex.isValid()) {
        int r = _nodeStyleIndex.row();
        if (_styles->nodeStyles()->moveRows(
                    _nodeStyleIndex.parent(),
                    r, 1,
                    _nodeStyleIndex.parent(),
                    r - 1))
        {
            setDirty(true);
            nodeItemChanged(_styles->nodeStyles()->index(r - 1));
        }
    }
}

void StyleEditor::on_styleDown_clicked()
{
    if (_nodeStyleIndex.isValid()) {
        int r = _nodeStyleIndex.row();
        if (_styles->nodeStyles()->moveRows(
                    _nodeStyleIndex.parent(),
                    r, 1,
                    _nodeStyleIndex.parent(),
                    r + 2))
        {
            setDirty(true);
            nodeItemChanged(_styles->nodeStyles()->index(r + 1));
        }
    }
}

void StyleEditor::on_addEdgeStyle_clicked()
{
    int i = 0;

    // get a fresh name
    QString name;
    while (true) {
        name = QString("new edge style ") + QString::number(i);
        if (_styles->edgeStyles()->style(name) == nullptr) break;
        ++i;
    }

    // add the style (edge styles only have one category: "")
    Style *s = new Style(name, new GraphElementData({GraphElementProperty("-")}));
    _styles->edgeStyles()->addStyle(s);

    // set dirty flag and select the newly-added style
    setDirty(true);
    selectEdgeStyle(_styles->edgeStyles()->numInCategory()-1);
}

void StyleEditor::on_removeEdgeStyle_clicked()
{
    if (_edgeStyleIndex.isValid()) {
        int i = _edgeStyleIndex.row();
        if (i > 0) {
            ui->edgeStyleListView->selectionModel()->clear();
            _styles->edgeStyles()->removeNthStyle(i);
            setDirty(true);
            if (i < _styles->edgeStyles()->numInCategory()) {
                selectEdgeStyle(i);
            }
        }
    }
}

void StyleEditor::on_edgeStyleUp_clicked()
{
    if (_edgeStyleIndex.isValid()) {
        int r = _edgeStyleIndex.row();
        if (_styles->edgeStyles()->moveRows(
                    _edgeStyleIndex.parent(),
                    r, 1,
                    _edgeStyleIndex.parent(),
                    r - 1))
        {
            setDirty(true);
            edgeItemChanged(_styles->edgeStyles()->index(r - 1));
        }
    }
}

void StyleEditor::on_duplicateEdgeStyle_clicked()
{
    if (_activeStyle->isEdgeStyle()){
        // get a fresh name
        QString name;
        QStringList list = _activeStyle->name().split(" ");
        bool is_last_int;
        int last = list.last().toInt(&is_last_int, 10);
        if (is_last_int){
            list.pop_back();
            while (true) {
                name = list.join(" ") + " " + QString::number(last);
                if (_styles->edgeStyles()->style(name) == nullptr) break;
                ++last;
            }
        } else {
            last = 1;
        }
        name = list.join(" ") + " " + QString::number(last);

        // add the style to the current category
        Style *s = new Style(name, _activeStyle->data()->copy());
        _styles->edgeStyles()->addStyle(s);

        // set dirty flag and select the newly-added style
        setDirty(true);
        selectEdgeStyle(_styles->edgeStyles()->numInCategory()-1);
    }
}

void StyleEditor::on_edgeStyleDown_clicked()
{
    if (_edgeStyleIndex.isValid()) {
        int r = _edgeStyleIndex.row();
        if (_styles->edgeStyles()->moveRows(
                    _edgeStyleIndex.parent(),
                    r, 1,
                    _edgeStyleIndex.parent(),
                    r + 2))
        {
            setDirty(true);
            edgeItemChanged(_styles->edgeStyles()->index(r + 1));
        }
    }
}

void StyleEditor::on_save_clicked()
{
    if (save())
        close();
}

void StyleEditor::on_currentCategory_currentIndexChanged(int)
{
    currentCategoryChanged();
}


bool StyleEditor::save() // tries to save, returns true if saved
{
    // check parsing of the new style
    _canParse = _styles->checkStyles();
    if (!_canParse) {
        qDebug() << "Style error, not saving";
        QMessageBox::StandardButton resBtn = QMessageBox::question(
                    this, "Parse error",
                    "Parsing error. Are you sure you want to save ? \nYou will not be able to open your styles in tikzit afterwards, you will need to correct it manually first.",
                    QMessageBox::No | QMessageBox::Yes,
                    QMessageBox::Yes);

        if (resBtn == QMessageBox::Yes) {
            _canParse = true;
        }
    }

    if (_canParse){
        QString p = tikzit->styleFilePath();

        if (_styles->saveStyles(p)) {
            setDirty(false);
            tikzit->loadStyles(p);

            return true;
        } else {
            QMessageBox::warning(0,
                "Unabled to save style file",
                "Unable to write to file: '" + tikzit->styleFile() + "'.");

            return false;
        }
    } else {
        return false;
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
        setDirty(true);
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
//    if (_styles != nullptr) {
//        if (_nodeStyleIndex.isValid())
//            return _styles->nodeStyles()->styleInCategory(_nodeStyleIndex.row());

//        if (_edgeStyleIndex.isValid())
//            return _styles->edgeStyles()->styleInCategory(_edgeStyleIndex.row());
//    }

    return _activeStyle;
}

void StyleEditor::refreshActiveStyle()
{
    if (_styles != nullptr) {
        QSettings settings("tikzit", "tikzit");
        bool ok;
        int space = settings.value("style-icon-spacing").toInt(&ok);
        if (!ok) space = 48;

        if (_nodeStyleIndex.isValid()) {
            emit _styles->nodeStyles()->dataChanged(_nodeStyleIndex, _nodeStyleIndex);

            // force a re-layout
            ui->styleListView->setGridSize(QSize(space,space));
        }

        if (_edgeStyleIndex.isValid()) {
            emit _styles->edgeStyles()->dataChanged(_edgeStyleIndex, _edgeStyleIndex);

            // force a re-layout
            ui->edgeStyleListView->setGridSize(QSize(space,space));
        }
    }
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
        Style *s = activeStyle();
        if (s != nullptr) {
            s->data()->setProperty(propName, tikzit->nameForColor(col));
            refreshActiveStyle();
            refreshDisplay();
            setDirty(true);
        }
    }
}

void StyleEditor::selectNodeStyle(int i)
{
    ui->styleListView->selectionModel()->setCurrentIndex(
                _styles->nodeStyles()->index(i),
                QItemSelectionModel::ClearAndSelect);
}

void StyleEditor::selectEdgeStyle(int i)
{
    ui->edgeStyleListView->selectionModel()->setCurrentIndex(
                _styles->edgeStyles()->index(i),
                QItemSelectionModel::ClearAndSelect);
}

bool StyleEditor::dirty() const
{
    return _dirty;
}

void StyleEditor::setDirty(bool dirty)
{
    _dirty = dirty;
    if (dirty) {
        setWindowTitle("Style Editor* - TikZiT");
    } else {
        setWindowTitle("Style Editor - TikZiT");
    }
}
