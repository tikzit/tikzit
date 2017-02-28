#include "tikzit.h"

#include <QFileDialog>
#include <QSettings>

// application-level instance of Tikzit
Tikzit *tikzit;

Tikzit::Tikzit()
{
    _activeWindow = 0;
    QMainWindow *dummy = new QMainWindow();

    _toolPalette = new ToolPalette(dummy);
    _propertyPalette = new PropertyPalette(dummy);

    createMenu();
    loadStyles();

    _toolPalette->show();
    _propertyPalette->show();

    _windows << new MainWindow();
    _windows[0]->show();
}

QMenuBar *Tikzit::mainMenu() const
{
    return _mainMenu;
}

ToolPalette *Tikzit::toolPalette() const
{
    return _toolPalette;
}

PropertyPalette *Tikzit::propertyPalette() const
{
    return _propertyPalette;
}

void Tikzit::createMenu()
{
    _mainMenu = new QMenuBar(0);
    QMenu *file = _mainMenu->addMenu(tr("&File"));
    QAction *aNew = file->addAction(tr("&New"));
    aNew->setShortcut(QKeySequence::New);
    QAction *aOpen = file->addAction(tr("&Open"));
    aOpen->setShortcut(QKeySequence::Open);

    QMenu *view = _mainMenu->addMenu(tr("&View"));
    QAction *aZoomIn = view->addAction(tr("Zoom &In"));
    aZoomIn->setShortcut(QKeySequence::ZoomIn);
    QAction *aZoomOut = view->addAction(tr("Zoom &Out"));
    aZoomOut->setShortcut(QKeySequence::ZoomOut);

    connect(aNew, SIGNAL(triggered()), this, SLOT(newDoc()));
    connect(aOpen, SIGNAL(triggered()), this, SLOT(open()));
    connect(aZoomIn, SIGNAL(triggered()), this, SLOT(zoomIn()));
    connect(aZoomOut, SIGNAL(triggered()), this, SLOT(zoomOut()));
}

void Tikzit::loadStyles()
{
    _nodeStyles << NodeStyle("black dot", NodeShape::Circle, Qt::black, Qt::black, 1);
    _nodeStyles << NodeStyle("white dot", NodeShape::Circle, Qt::white, Qt::black, 1);
    _nodeStyles << NodeStyle("gray dot", NodeShape::Circle, Qt::gray, Qt::black, 1);
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
        if (_windows.isEmpty()) _activeWindow = 0;
        else _activeWindow = _windows[0];
    }
}

NodeStyle Tikzit::nodeStyle(QString name)
{
    foreach (NodeStyle s , _nodeStyles)
        if (s.name == name) return s;
    return NodeStyle(name, NodeShape::Circle, Qt::white);
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

void Tikzit::zoomIn()
{
    if (_activeWindow != 0) _activeWindow->tikzView()->zoomIn();
}

void Tikzit::zoomOut()
{
    if (_activeWindow != 0) _activeWindow->tikzView()->zoomOut();
}
