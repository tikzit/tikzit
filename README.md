
# TikZiT

TikZiT is a graphical tool for rapidly creating graphs and diagrams using PGF/TikZ. It was used, for example, to make all of the 2500+ diagrams in <a href="http://cambridge.org/pqp">this book</a>. It is currently undergoing a port to Qt5 for better cross-platform support. As such, the code on this branch, and these instructions are a work in progress.

## Building on Windows

TiKZiT can be built in Windows using Qt Creator (part of <a href="http://doc.qt.io/qt-5/windows-support.html">Qt for Windows</a>) or Visual Studio with the Qt VS Tools extension.

To build with Qt Creator, simply click 'Open Project' and navigate to the `.pro` file in the TikZiT repo.

To install Qt VS Tools in Visual Studio 2017, go to `Tools > Extensions and Updates`, then click "Online" in the sidebar and search for Qt. Configure your Qt install under `Qt VS Tools > Qt Options`. If you installed Qt using the Windows package above, the path to Qt is probably something like `C:\Qt\5.XXX\msvc2017_64`. Once that is done, open the `.pro` file in the TikZiT repo via `Qt VS Tools > Open Qt Project File`.

The only dependency besides Qt itself is flex/bison, which is used to build the TikZ parser. The simplest way to install this is to download <a href="https://github.com/lexxmark/winflexbison">WinFlexBison</a>, then rename or copy `win_flex.exe` and `win_bison.exe` to `flex.exe` and `bison.exe` respectively, and make sure both are in your `%PATH%` so the build tools can find them.


## Building on Linux

This should be buildable in Linux using a "standard" dev setup (gcc, flex, bison, make). You will also need to configure Qt (see instructions for <a href="https://wiki.qt.io/Install_Qt_5_on_openSUSE">openSUSE</a>, <a href="https://wiki.qt.io/Install_Qt_5_on_Ubuntu">Ubuntu</a> and <a href="https://wiki.archlinux.org/index.php/qt">Arch Linux</a>). After that, building is:

    $ qmake
    $ make



## Building on MacOS

You'll need Qt5 and poppler with Qt5 bindings. Qt5 can be installed using e.g. Homebrew, as follows:

    $ brew install qt5

This doesn't add Qt binaries to the PATH by default, so you may wish to add this to your shell startup script:

    export PATH="/usr/local/opt/qt/bin:$PATH"

Then, TikZiT is built just like a normal Qt project:

    $ qmake
    $ make

## Building with Nix

We also provide a convenient way to build and install using the [nix package manager](https://nixos.org/nix/)

To build run:
```bash
# for nix 2
nix build
# for older nix versions
nix-build
```

This symlinks the results in a local folder `result` where you can execute TikZit as `result/bin/tikzit`

To install run:

```bash
nix-env -f . -i tikzit
# or specify the path to the folder containing the .nix files as the -f argument
```

## Building Poppler with Qt bindings

Although TikZiT doesn't currently support PDF preview, it probably will in the near future via Poppler. Here's the instructions for building it as a developer.

Poppler should be built from source to get the Qt5 bindings. If Qt is setup correctly, the configure script included with Poppler should enable these automatically. Also, note that clang needs to have C++11 features enabled to build successfully. TikZiT has been tested on MacOS with poppler-0.50.0 (available <a href="https://poppler.freedesktop.org/releases.html">here</a>), built with the following commands:

    $ CXXFLAGS="-std=c++11" ./configure
    $ CXXFLAGS="-std=c++11" make
