#ifndef TESTTIKZOUTPUT_H
#define TESTTIKZOUTPUT_H

#include <QObject>

class TestTikzOutput : public QObject
{
    Q_OBJECT
private slots:
    void escape();
    void data();
};

#endif // TESTTIKZOUTPUT_H
