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
