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

#include "latexprocess.h"
#include "tikzit.h"

#include <QDebug>
#include <QStandardPaths>
#include <QTemporaryDir>
#include <QStringList>

LatexProcess::LatexProcess(PreviewWindow *preview, QObject *parent) : QObject(parent)
{
    _preview = preview;
    _output = preview->outputTextEdit();

    _proc = new QProcess(this);
    _proc->setProcessChannelMode(QProcess::MergedChannels);
    _proc->setWorkingDirectory(_workingDir.path());

    connect(_proc, SIGNAL(readyReadStandardOutput()), this, SLOT(readyReadStandardOutput()));
    connect(_proc, SIGNAL(finished(int)), this, SLOT(finished(int)));

    // for debug purposes
    _workingDir.setAutoRemove(false);
}

void LatexProcess::makePreview(QString tikz)
{
    _preview->setStatus(PreviewWindow::Running);
    _output->clear();

    if (!_workingDir.isValid()) {
        _output->appendPlainText("COULD NOT WRITE TO TEMP DIR: " + _workingDir.path() + "\n");
        return;
    }

    _output->appendPlainText("USING TEMP DIR: " + _workingDir.path() + "\n");
    _output->appendPlainText("SEARCHING FOR pdflatex IN:");
    _output->appendPlainText(qgetenv("PATH"));
    _output->appendPlainText("\n");


    QString pdflatex = QStandardPaths::findExecutable("pdflatex");
    if (pdflatex.isEmpty()) {
        // if pdflatex is not in PATH, we are probably on mac or windows, so try common
        // install directories.
        _output->appendPlainText("NOT FOUND IN PATH, TRYING:");

        QStringList texDirs;
        // common macOS tex directories:
        texDirs << "/Library/TeX/texbin";
        texDirs << "/usr/texbin";
        texDirs << "/usr/local/bin";
        texDirs << "/sw/bin";

        // common windows tex directories
        texDirs << "C:\\Program Files\\MiKTeX 2.9\\miktex\\bin";
        texDirs << "C:\\Program Files\\MiKTeX 2.9\\miktex\\bin\\x64";

        _output->appendPlainText(texDirs.join(":"));
        pdflatex = QStandardPaths::findExecutable("pdflatex", texDirs);

        if (pdflatex.isEmpty()) {
            _output->appendPlainText("pdflatex NOT FOUND, ABORTING.\n");
            _preview->setStatus(PreviewWindow::Failed);
            return;
        }
    }

    _output->appendPlainText("FOUND: " + pdflatex + "\n");

    // copy tikzit.sty to preview dir
    QFile::copy(":/tex/sample/tikzit.sty", _workingDir.path() + "/tikzit.sty");

    // write out the file containing the tikz picture
    QFile f(_workingDir.path() + "/preview.tex");
    f.open(QIODevice::WriteOnly);
    QTextStream tex(&f);
    tex << "\\documentclass{article}\n";
    tex << "\\usepackage{tikzit}\n";
    tex << "\\usepackage[graphics,active,tightpage]{preview}\n";
    tex << "\\PreviewEnvironment{tikzpicture}\n";

    // copy active *.tikzstyles file to preview dir
    if (!tikzit->styleFile().isEmpty() && QFile::exists(tikzit->styleFilePath())) {
        QFile::copy(tikzit->styleFilePath(), _workingDir.path() + "/" + tikzit->styleFile());
        tex << "\\input{" + tikzit->styleFile() + "}\n";

        // if there is a *.tikzdefs file with the same basename, copy and include it as well
        QFileInfo fi(tikzit->styleFilePath());
        QString defFile = fi.baseName() + ".tikzdefs";
        QString defFilePath = fi.absolutePath() + "/" + defFile;
        if (QFile::exists(defFilePath)) {
            QFile::copy(defFilePath, _workingDir.path() + "/" + defFile);
            tex << "\\input{" + defFile + "}\n";
        }
    }

    tex << "\\begin{document}\n\n";
    tex << tikz;
    tex << "\n\n\\end{document}\n";

    f.close();
    _proc->start(pdflatex,
                 QStringList()
                 << "-interaction=nonstopmode"
                 << "-halt-on-error"
                 << "preview.tex");

}

void LatexProcess::kill()
{
    if (_proc->state() == QProcess::Running) _proc->kill();
}

void LatexProcess::readyReadStandardOutput()
{
    QByteArray s = _proc->readAllStandardOutput();
    _output->appendPlainText(s);
}

void LatexProcess::finished(int exitCode)
{
    QByteArray s = _proc->readAllStandardOutput();
    _output->appendPlainText(s);

    if (exitCode == 0) {
        QString pdf = _workingDir.path() + "/preview.pdf";
        _output->appendPlainText("\n\nSUCCESSFULLY GENERATED: " + pdf + "\n");
        _preview->setPdf(pdf);
        _preview->setStatus(PreviewWindow::Success);
        emit previewFinished();
    } else {
        _output->appendPlainText("\n\npdflatex RETURNED AN ERROR\n");
        _preview->setStatus(PreviewWindow::Failed);
        emit previewFinished();
    }
}
