# CONFIG += debug

QT += core gui widgets network

VERSION = 2.1.1

test {
    CONFIG += testcase
}

TARGET   = tikzit
TEMPLATE = app

isEmpty(PREFIX) {
    PREFIX=/usr/local
}

share.path = $${PREFIX}/share
share.files = share/*

target.path = $${PREFIX}/bin
INSTALLS += target share

# platform-specific options
win32:RC_ICONS += images/tikzit.ico
win32:RC_ICONS += images/tikzdoc.ico
macx:ICON = images/tikzit.icns
# linux-g++:QMAKE_CXXFLAGS += -Wsuggest-override

QMAKE_INFO_PLIST = Info.plist

# Qt 5.8 and above drop support for Mountain Lion
contains(QT_VERSION, ^5\\.[5-7].*) {
    macx:QMAKE_MACOSX_DEPLOYMENT_TARGET = 10.8
    #macx:QMAKE_MAC_SDK = macosx10.11
}

# The following define makes your compiler emit warnings if you use
# any feature of Qt which as been marked as deprecated (the exact warnings
# depend on your compiler). Please consult the documentation of the
# deprecated API in order to know how to port your code away from it.
DEFINES += QT_DEPRECATED_WARNINGS

# You can also make your code fail to compile if you use deprecated APIs.
# In order to do so, uncomment the following line.
# You can also select to disable deprecated APIs only up to a certain version of Qt.
#DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0

FLEXSOURCES = src/data/tikzlexer.l
BISONSOURCES = src/data/tikzparser.y

include(flex.pri)
include(bison.pri)

SOURCES += src/gui/mainwindow.cpp \
    src/gui/toolpalette.cpp \
    src/gui/tikzscene.cpp \
    src/data/graph.cpp \
    src/data/node.cpp \
    src/data/edge.cpp \
    src/data/graphelementdata.cpp \
    src/data/graphelementproperty.cpp \
    src/gui/propertypalette.cpp \
    src/gui/tikzview.cpp \
    src/gui/nodeitem.cpp \
    src/gui/edgeitem.cpp \
    src/tikzit.cpp \
    src/gui/commands.cpp \
    src/data/tikzdocument.cpp \
    src/gui/undocommands.cpp \
    src/gui/mainmenu.cpp \
    src/util.cpp \
    src/gui/stylepalette.cpp \
    src/data/tikzassembler.cpp \
    src/data/tikzstyles.cpp \
    src/data/style.cpp \
    src/gui/styleeditor.cpp \
    src/data/stylelist.cpp \
    src/gui/previewwindow.cpp \
    src/gui/latexprocess.cpp \
    src/data/pdfdocument.cpp \
    src/gui/exportdialog.cpp \
    src/data/delimitedstringvalidator.cpp \
    src/gui/delimitedstringitemdelegate.cpp \
    src/gui/preferencedialog.cpp

HEADERS  += src/gui/mainwindow.h \
    src/gui/toolpalette.h \
    src/gui/tikzscene.h \
    src/data/graph.h \
    src/data/node.h \
    src/data/edge.h \
    src/data/graphelementdata.h \
    src/data/graphelementproperty.h \
    src/gui/propertypalette.h \
    src/data/tikzparserdefs.h \
    src/gui/tikzview.h \
    src/gui/nodeitem.h \
    src/tikzit.h \
    src/gui/edgeitem.h \
    src/gui/commands.h \
    src/data/tikzdocument.h \
    src/gui/undocommands.h \
    src/gui/mainmenu.h \
    src/util.h \
    src/gui/stylepalette.h \
    src/data/tikzassembler.h \
    src/data/tikzstyles.h \
    src/data/style.h \
    src/gui/styleeditor.h \
    src/data/stylelist.h \
    src/gui/previewwindow.h \
    src/gui/latexprocess.h \
    src/data/pdfdocument.h \
    src/gui/exportdialog.h \
    src/data/delimitedstringvalidator.h \
    src/gui/delimitedstringitemdelegate.h \
    src/gui/preferencedialog.h

FORMS += src/gui/mainwindow.ui \
    src/gui/propertypalette.ui \
    src/gui/mainmenu.ui \
    src/gui/stylepalette.ui \
    src/gui/styleeditor.ui \
    src/gui/previewwindow.ui \
    src/gui/exportdialog.ui \
    src/gui/preferencedialog.ui

INCLUDEPATH += src src/gui src/data

# link to pre-compiled poppler libs on windows
win32 {
    INCLUDEPATH += win32-deps/include
    LIBS += -L"$$PWD/win32-deps/bin"
}

macx {
    INCLUDEPATH += /usr/local/opt/poppler/include
    LIBS += -L/usr/local/opt/poppler/lib
}   

LIBS += -lpoppler-qt5

DISTFILES +=

RESOURCES += tikzit.qrc

test {
    QT += testlib
    TARGET = UnitTests
    SOURCES -= src/main.cpp
    HEADERS += src/test/testtest.h \
        src/test/testparser.h \
        src/test/testtikzoutput.h
    SOURCES += src/test/testmain.cpp \
        src/test/testtest.cpp \
        src/test/testparser.cpp \
        src/test/testtikzoutput.cpp
} else {
    SOURCES += src/main.cpp
}



