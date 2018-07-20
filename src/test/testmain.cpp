#include "testtest.h"
#include "testparser.h"
#include "testtikzoutput.h"

#include <QTest>
#include <QDebug>
#include <iostream>

int main(int argc, char *argv[])
{
    TestTest test;
    TestParser parser;
    TestTikzOutput tikzOutput;
    int r = QTest::qExec(&test, argc, argv) |
            QTest::qExec(&parser, argc, argv) |
            QTest::qExec(&tikzOutput, argc, argv);

    if (r == 0) std::cout << "***************** All tests passed! *****************\n";
    else std::cout << "***************** Some tests failed. *****************\n";

    return r;
}
