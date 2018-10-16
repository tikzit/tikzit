#-------------------------------------------------
#
# Project created by QtCreator 2017-01-11T17:30:16
#
#-------------------------------------------------

QT       += core gui widgets
CONFIG   += testcase

TARGET   = tikzit
TEMPLATE = app

# platform-specific options
win32:RC_ICONS += images/tikzit.ico
win32:RC_ICONS += images/tikzdoc.ico
macx:ICON = images/tikzit.icns
# linux-g++:QMAKE_CXXFLAGS += -Wsuggest-override

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
    src/data/stylelist.cpp

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
    src/data/stylelist.h

FORMS += src/gui/mainwindow.ui \
    src/gui/propertypalette.ui \
    src/gui/mainmenu.ui \
    src/gui/stylepalette.ui \
    src/gui/styleeditor.ui

INCLUDEPATH += src src/gui src/data

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

