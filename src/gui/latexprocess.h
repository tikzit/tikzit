#ifndef LATEXPROCESS_H
#define LATEXPROCESS_H

#include "previewwindow.h"

#include <QObject>
#include <QProcess>
#include <QTemporaryDir>
#include <QPlainTextEdit>

class LatexProcess : public QObject
{
    Q_OBJECT
public:
    explicit LatexProcess(PreviewWindow *preview, QObject *parent = nullptr);
    void makePreview(QString tikz);
    void kill();

private:
    QTemporaryDir _workingDir;
    PreviewWindow *_preview;
    QPlainTextEdit *_output;
    QProcess *_proc;

public slots:
    void readyReadStandardOutput();
    void finished(int exitCode);

signals:
    void previewFinished();
};

#endif // LATEXPROCESS_H
