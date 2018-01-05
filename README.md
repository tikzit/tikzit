
# TikZiT

TikZiT is a graphical tool for rapidly creating graphs and diagrams using PGF/TikZ. It was used, for example, to make all of the 2500+ diagrams in <a href="http://cambridge.org/pqp">this book</a>. It is currently undergoing a port to Qt5 for better cross-platform support. As such, the code on this branch, and these instructions are a work in progress.

## Building on Windows

TODO

## Building on Linux

TODO

## Building on MacOS

You'll need Qt5 and poppler with Qt5 bindings. Qt5 can be installed using e.g. Homebrew, as follows:

    $ brew install qt5

This doesn't add Qt binaries to the PATH by default, so you may wish to add this to your shell startup script:

    export PATH="/usr/local/opt/qt/bin:$PATH"

Poppler should be built from source to get the Qt5 bindings. If Qt is setup correctly, the configure script included with Poppler should enable these automatically. Also, note that clang needs to have C++11 features enabled to build successfully. TikZiT has been tested on MacOS with poppler-0.50.0 (available <a href="https://poppler.freedesktop.org/releases.html">here</a>), built with the following commands:

    $ CXXFLAGS="-std=c++11" ./configure
    $ CXXFLAGS="-std=c++11" make

Then, TikZiT is built just like a normal Qt project:

    $ qmake
    $ make
