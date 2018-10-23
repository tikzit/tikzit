
# TikZiT

TikZiT is a graphical tool for rapidly creating graphs and string diagrams using PGF/TikZ. It was used, for example, to make all of the 2500+ diagrams in <a href="http://cambridge.org/pqp">this book</a>.

## Building on Windows

TiKZiT can be built in Windows using Qt Creator (part of <a href="http://doc.qt.io/qt-5/windows-support.html">Qt for Windows</a>) or Visual Studio with the Qt VS Tools extension.

To build with Qt Creator, simply click 'Open Project' and navigate to the `.pro` file in the TikZiT repo.

To install Qt VS Tools in Visual Studio 2017, go to `Tools > Extensions and Updates`, then click "Online" in the sidebar and search for Qt. Configure your Qt install under `Qt VS Tools > Qt Options`. If you installed Qt using the Windows package above, the path to Qt is probably something like `C:\Qt\5.XXX\msvc2017_64`. Once that is done, open the `.pro` file in the TikZiT repo via `Qt VS Tools > Open Qt Project File`.

The only dependency besides Qt itself is flex/bison, which is used to build the TikZ parser. The simplest way to install this is to download <a href="https://github.com/lexxmark/winflexbison">WinFlexBison</a>, then rename or copy `win_flex.exe` and `win_bison.exe` to `flex.exe` and `bison.exe` respectively, and make sure both are in your `%PATH%` so the build tools can find them.

You can alternatively build from the command line with mingw or Visual Studio, and install necessary dependencies via <a href="https://chocolatey.org">Chocolatey</a>. This setup has been tested on Windows 10 with Visual Studio 2015 and Qt 5.11.1. After installing Qt 5.11 and Visual Studio, run the following commands in a `cmd` prompt:

    
    choco install winflexbison
    C:\Qt\5.11.1\msvc2015_64\bin\qtenv2.bat
    call "C:\ProgramFiles (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat" x64
    cd C:\path\to\tikzit
    qmake
    nmake.exe



## Building on Linux

This should be buildable in Linux using a "standard" dev setup (gcc, flex, bison, make) as well as Qt. It has been tested with Qt 5.9, which is packaged with Ubuntu 18.04 (Bionic Beaver). The setup on Ubuntu is:

    $ sudo apt-get install flex bison qt5-default

After that, building is:

    $ qmake
    $ make

Building on other distributions should be similar. For Qt setup, you can find instructions for <a href="https://wiki.qt.io/Install_Qt_5_on_openSUSE">openSUSE</a> and <a href="https://wiki.archlinux.org/index.php/qt">Arch Linux</a> on the Qt wiki.


## Building on MacOS

You'll need Qt5 and poppler with Qt5 bindings. Qt5 can be installed using e.g. Homebrew, as follows:

    $ brew install qt5

This doesn't add Qt binaries to the PATH by default, so you may wish to add this to your shell startup script:

    export PATH="/usr/local/opt/qt/bin:$PATH"

Then, TikZiT is built just like a normal Qt project:

    $ qmake
    $ make


On older systems (pre-10.11), you can build with Qt 5.6, which <a href="http://doc.qt.io/qt-5/supported-platforms-and-configurations.html">claims</a> to support Mac OS as far back as Mountain Lion. It is installable via <a href="https://www.macports.org">MacPorts</a>:

    $ sudo port -N -k install qt56
    $ export PATH=/opt/local/libexec/qt5/bin:$PATH

Then, you should be able to run `qmake && make`, as above.




## Building Poppler with Qt bindings

Although TikZiT doesn't currently support PDF preview, it probably will in the near future via Poppler. Here's the instructions for building it as a developer.

Poppler should be built from source to get the Qt5 bindings. If Qt is setup correctly, the configure script included with Poppler should enable these automatically. Also, note that clang needs to have C++11 features enabled to build successfully. TikZiT has been tested on MacOS with poppler-0.50.0 (available <a href="https://poppler.freedesktop.org/releases.html">here</a>), built with the following commands:

    $ CXXFLAGS="-std=c++11" ./configure
    $ CXXFLAGS="-std=c++11" make

