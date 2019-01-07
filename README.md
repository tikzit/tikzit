
# TikZiT

TikZiT is a graphical tool for rapidly creating graphs and string diagrams using PGF/TikZ. It was used, for example, to make all of the 2500+ diagrams in <a href="http://cambridge.org/pqp">this book</a>.

## Building on Windows

TiKZiT can be built in Windows using Qt Creator (part of <a href="http://doc.qt.io/qt-5/windows-support.html">Qt for Windows</a>) or from the command line. In either case, it is recommended you compile with <a href="http://www.mingw.org/">mingw32</a>, which is included in the official Qt distribution. There is no reason, in principle, that you couldn't use mingw64 or MSVC, but these haven't been tested.

In addition to Qt itself, TikZiT needs flex/bison, <a href="https://poppler.freedesktop.org/">Poppler</a> (with Qt bindings), and <a href="https://www.openssl.org/">OpenSSL</a>. For flex/bison, the simplest way to install this is to download <a href="https://github.com/lexxmark/winflexbison">WinFlexBison</a>, then make sure both are in your `%Path%` so the build tools can find them. Alternatively, you can install it via <a href="https://chocolatey.org">Chocolatey</a>, via:

    > choco install winflexbison

For convenience, I have packaged up some headers and pre-built DLLs to take care of the Poppler and OpenSSL dependencies in a single shot. If you wish to use these, download <a href="http://tikzit.github.io/download/win32-deps.zip">win32-deps.zip</a> and extract it into the source folder before building. At this point, you should be able to open `tikzit.pro` in Qt Creator and build the project. If you wish to build from the command line, make sure `mingw32-make.exe` is in your `%Path%`. For the version that comes with Qt, this is in `C:\Qt\Tools\mingw530_32\bin`. Then, from the command prompt, run:

    > C:\Qt\5.XX.X\mingw53_32\bin\qtenv2.bat
    > cd \path\to\tikzit
    > qmake -r
    > mingw32-make

To get a portable directory, you can then (optionally) run:

    > deploy-win.bat



## Building on Linux

This should be buildable in Linux using a "standard" dev setup (gcc, flex, bison, make) as well as Qt. It has been tested with Qt 5.9, which is packaged with Ubuntu 18.04 (Bionic Beaver). The setup on Ubuntu is:

    $ sudo apt -y install flex bison qt5-default libpoppler-dev libpoppler-qt5-dev

After that, building is:

    $ qmake -r
    $ make

To get a portable directory, you can then (optionally) run:

    ./deploy-linux.sh

Building on other distributions should be similar. For Qt setup, you can find instructions for <a href="https://wiki.qt.io/Install_Qt_5_on_openSUSE">openSUSE</a> and <a href="https://wiki.archlinux.org/index.php/qt">Arch Linux</a> on the Qt wiki.


## Building on MacOS

You'll need developer tools, Qt5, and Poppler (with Qt bindings) installed. You can install these via Homebrew with the following commands:

    $ brew install qt5
    $ brew install poppler --with-qt

This doesn't add Qt binaries to the `$PATH` by default, so you may wish either run:

    $ brew link --force qt5

or add `/usr/local/opt/qt/bin` to your `$PATH`. Once this is done, TikZiT can be built from the command line via:

    $ qmake -r
    $ make

To bundle the required libraries into `tikzit.app` and create a `.dmg` file, you can additionally run:

    $ ./deploy-osx.sh


On older systems (pre-10.11), you can build with Qt 5.6, which <a href="http://doc.qt.io/qt-5/supported-platforms-and-configurations.html">claims</a> to support Mac OS as far back as Mountain Lion. It is installable via <a href="https://www.macports.org">MacPorts</a>:

    $ sudo port -N -k install qt56
    $ export PATH=/opt/local/libexec/qt5/bin:$PATH

I have only tested this with TikZiT 2.0, so to install Poppler (required by TikZiT >= 2.1), you are on your own.
