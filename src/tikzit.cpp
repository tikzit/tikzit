#include "tikzit.h"
#include "tikzassembler.h"
#include "tikzstyles.h"

#include <QFile>
#include <QFileDialog>
#include <QSettings>
#include <QDebug>
#include <QMessageBox>

// application-level instance of Tikzit
Tikzit *tikzit;

// font to use for node labels
QFont Tikzit::LABEL_FONT("Courrier", 9);

Tikzit::Tikzit() : _styleFile("[default]"), _activeWindow(0)
{
}

void Tikzit::init(QApplication *app)
{
    QSettings settings("tikzit", "tikzit");
    _mainMenu = new MainMenu();
    QMainWindow *dummy = new QMainWindow();

    _toolPalette = new ToolPalette(dummy);
    _propertyPalette = new PropertyPalette(dummy);
    _stylePalette = new StylePalette(dummy);
    _styles = new TikzStyles(this);

    _stylePalette->show();
    _windows << new MainWindow();
    _windows[0]->show();

    QString styleFile = settings.value("previous-tikzstyles-file").toString();
    if (!styleFile.isEmpty()) loadStyles(styleFile);

    //connect(app, &QApplication::focusChanged, this, &focusChanged);
}

//QMenuBar *Tikzit::mainMenu() const
//{
//    return _mainMenu;
//}

ToolPalette *Tikzit::toolPalette() const
{
    return _toolPalette;
}

PropertyPalette *Tikzit::propertyPalette() const
{
    return _propertyPalette;
}

void Tikzit::newDoc()
{
    MainWindow *w = new MainWindow();
    w->show();
    _windows << w;
}

MainWindow *Tikzit::activeWindow() const
{
    return _activeWindow;
}

void Tikzit::setActiveWindow(MainWindow *activeWindow)
{
    _activeWindow = activeWindow;
}

void Tikzit::removeWindow(MainWindow *w)
{
    _windows.removeAll(w);
    if (_activeWindow == w) {
        if (_windows.isEmpty()) {
            _activeWindow = 0;
            // TODO: check if we should quit when last window closed
            quit();
        } else _activeWindow = _windows[0];
    }
}

void Tikzit::open()
{
    QSettings settings("tikzit", "tikzit");
    QString fileName = QFileDialog::getOpenFileName(0,
                tr("Open File"),
                settings.value("previous-file-path").toString(),
                tr("TiKZ Files (*.tikz)"));

    if (!fileName.isEmpty()) {
        if (_windows.size() == 1 && _windows[0]->pristine()) {
            _windows[0]->open(fileName);
            _windows[0]->show();
        } else {
            MainWindow *w = new MainWindow();
            w->show();
            w->open(fileName);
            _windows << w;
        }
    }
}

void Tikzit::openTikzStyles() {
    QSettings settings("tikzit", "tikzit");
    QString fileName = QFileDialog::getOpenFileName(0,
                tr("Open File"),
                settings.value("previous-tikzstyles-path").toString(),
                tr("TiKZ Style Files (*.tikzstyles)"));

    if (!fileName.isEmpty()) {
        loadStyles(fileName);
    }
}

void Tikzit::loadStyles(QString fileName)
{
    QSettings settings("tikzit", "tikzit");
    QFile file(fileName);
    if (file.open(QIODevice::ReadOnly)) {
        QFileInfo fi(file);
        settings.setValue("previous-tikzstyles-path", fi.absolutePath());
        settings.setValue("previous-tikzstyles-file", fileName);
        _styleFile = fi.fileName();
        QTextStream in(&file);
        QString styleTikz = in.readAll();
        file.close();

        _styles->clear();
        TikzAssembler ass(_styles);
        bool parseSuccess = ass.parse(styleTikz);
        if (parseSuccess) {
            qDebug() << "parse successful";
        } else {
            qDebug() << "parse failed";
        }
        _stylePalette->reloadStyles();

        foreach (MainWindow *w, _windows) {
            w->tikzScene()->reloadStyles();
        }

    } else {
        settings.setValue("previous-tikzstyles-file", "");
        QMessageBox::warning(0, "Style file not found.", "Could not open style file: '" + fileName + "', reverting to default.");
    }
}

QString Tikzit::styleFile() const
{
    return _styleFile;
}

void Tikzit::focusChanged(QWidget *old, QWidget *nw)
{
//    foreach (MainWindow *w, _windows) {
//        if (w->isActiveWindow()) {
//            _stylePalette->raise();
//            break;
//        }
//    }
}

StylePalette *Tikzit::stylePalette() const
{
    return _stylePalette;
}


TikzStyles *Tikzit::styles() const
{
    return _styles;
}

void Tikzit::quit()
{
    _stylePalette->close();
    QApplication::quit();
}


