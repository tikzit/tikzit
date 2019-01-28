cmake_minimum_required(VERSION 3.1.0)

project(tikzit LANGUAGES CXX)

set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_AUTOMOC ON)
#set(CMAKE_AUTOUIC ON)

find_package(Qt5 REQUIRED COMPONENTS Core Gui Widgets Network)
find_package(BISON)
find_package(FLEX)

# use extra-cmake-modules to find poppler library
find_package(ECM REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${ECM_FIND_MODULE_DIR})
find_package(Poppler REQUIRED COMPONENTS Core Qt5)

include_directories(
    ${PROJECT_SOURCE_DIR}
    ${PROJECT_SOURCE_DIR}/src
    ${PROJECT_SOURCE_DIR}/src/data
    ${PROJECT_SOURCE_DIR}/src/gui
)

BISON_TARGET(PARSER src/data/tikzparser.y ${CMAKE_CURRENT_BINARY_DIR}/tikzparser.parser.cpp)
FLEX_TARGET(LEXER src/data/tikzlexer.l ${CMAKE_CURRENT_BINARY_DIR}/tikzlexer.lexer.cpp)
ADD_FLEX_BISON_DEPENDENCY(LEXER PARSER)
cmake_policy(SET CMP0071 NEW) # run AUTOXXX on generated files ('NEW' default behaviour)

set(SOURCES
    src/data/delimitedstringvalidator.cpp
    src/data/edge.cpp
    src/data/graph.cpp
    src/data/graphelementdata.cpp
    src/data/graphelementproperty.cpp
    src/data/node.cpp
    src/data/pdfdocument.cpp
    src/data/style.cpp
    src/data/stylelist.cpp
    src/data/tikzassembler.cpp
    src/data/tikzdocument.cpp
    src/data/tikzlexer.lexer.cpp
    src/data/tikzparser.parser.cpp
    src/data/tikzstyles.cpp
    src/gui/commands.cpp
    src/gui/delimitedstringitemdelegate.cpp
    src/gui/edgeitem.cpp
    src/gui/exportdialog.cpp
    src/gui/latexprocess.cpp
    src/gui/mainmenu.cpp
    src/gui/mainwindow.cpp
    src/gui/nodeitem.cpp
    src/gui/preferencedialog.cpp
    src/gui/previewwindow.cpp
    src/gui/propertypalette.cpp
    src/gui/styleeditor.cpp
    src/gui/stylepalette.cpp
    src/gui/tikzscene.cpp
    src/gui/tikzview.cpp
    src/gui/toolpalette.cpp
    src/gui/undocommands.cpp
    src/main.cpp
    src/test/testmain.cpp
    src/test/testparser.cpp
    src/test/testtest.cpp
    src/test/testtikzoutput.cpp
    src/tikzit.cpp
    src/util.cpp
)

set(HEADERS
    src/data/edge.h
    src/data/graph.h
    src/data/graphelementdata.h
    src/data/graphelementproperty.h
    src/data/node.h
    src/data/pdfdocument.h
    src/data/style.h
    src/data/stylelist.h
    src/data/tikzassembler.h
    src/data/tikzdocument.h
    src/data/tikzparserdefs.h
    src/data/tikzstyles.h
    src/gui/commands.h
    src/gui/delimitedstringitemdelegate.h
    src/gui/edgeitem.h
    src/gui/exportdialog.h
    src/gui/latexprocess.h
    src/gui/mainmenu.h
    src/gui/mainwindow.h
    src/gui/nodeitem.h
    src/gui/preferencedialog.h
    src/gui/previewwindow.h
    src/gui/propertypalette.h
    src/gui/styleeditor.h
    src/gui/stylepalette.h
    src/gui/tikzscene.h
    src/gui/tikzview.h
    src/gui/toolpalette.h
    src/gui/undocommands.h
    src/test/testparser.h
    src/test/testtest.h
    src/test/testtikzoutput.h
    src/tikzit.h
    src/util.h
)

set(FORMS
    src/gui/exportdialog.ui
    src/gui/mainmenu.ui
    src/gui/mainwindow.ui
    src/gui/preferencedialog.ui
    src/gui/previewwindow.ui
    src/gui/propertypalette.ui
    src/gui/styleeditor.ui
    src/gui/stylepalette.ui
)

qt5_wrap_ui(FORM_HEADERS ${FORMS})
qt5_add_resources(QT_RESOURCES tikzit.qrc)



add_executable(tikzit
    ${SOURCES}
    ${HEADERS}
    ${FORM_HEADERS}
    ${FLEX_LEXER_OUTPUTS}
    ${BISON_PARSER_OUTPUTS}
    ${QT_RESOURCES})

target_link_libraries(${PROJECT_NAME}
    Qt5::Core Qt5::Gui Qt5::Widgets Qt5::Network
    ${Poppler_LIBRARIES})
