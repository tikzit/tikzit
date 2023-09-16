#!/bin/bash

# TODO: this comment is out of date, update with new test:
#
# Deployment script for Linux x64 portable binary. This
# script is tested on a clean Ubuntu 18.04, after running:
# 
# apt-get -y install \
#  flex bison qt5-default libpoppler-dev \
#  libpoppler-qt5-dev
#

# system library directory
SYSLIBDIR=/lib/x86_64-linux-gnu

# userspace library directory
LIBDIR=/usr$SYSLIBDIR

# qt library directory (requires QTDIR to be set)
QTLIBDIR=$QTDIR/lib

# directory where Qt plugins can be found
PLUGINDIR=$QTDIR/plugins

mkdir -p dist/tikzit
cd dist/tikzit
mkdir -p opt
mkdir -p bin
mkdir -p lib
mkdir -p plugins

# add README file
cat > README << 'EOF'
This is a portable version of TikZiT 2.1. To launch TikZiT, simply run
'bin/tikzit'. To install launcher and icons for the current user, make
sure the 'bin' sub-directory is in your $PATH and run:

# ./install-local.sh

inside the tikzit directory.


TikZiT is released under the GNU General Public License, Version 3. See:

http://tikzit.github.io

for full details and source code.
EOF

# add helper scripts
cat > install-local.sh << 'EOF'
#!/bin/bash

mkdir -p ~/.local
cp -r share ~/.local/
update-mime-database ~/.local/share/mime
update-desktop-database ~/.local/share/applications
EOF
chmod +x install-local.sh


cat > bin/tikzit << 'EOF'
#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && cd .. && pwd )"
LD_LIBRARY_PATH=$DIR/lib:$LD_LIBRARY_PATH QT_PLUGIN_PATH=$DIR/plugins $DIR/opt/tikzit $@
EOF
chmod +x bin/tikzit

# add tikzit binary
cp ../../tikzit opt

# add icons, desktop entry, and MIME data
cp -R ../../share .

# add Qt libs. Keep shortened lib names as symlinks.
cp --no-dereference $QTLIBDIR/libQt5Core.so* lib
cp --no-dereference $QTLIBDIR/libQt5DBus.so* lib
cp --no-dereference $QTLIBDIR/libQt5Widgets.so* lib
cp --no-dereference $QTLIBDIR/libQt5Svg.so* lib
cp --no-dereference $QTLIBDIR/libQt5Network.so* lib
cp --no-dereference $QTLIBDIR/libQt5Gui.so* lib
cp --no-dereference $QTLIBDIR/libQt5XcbQpa.so* lib
cp --no-dereference $QTLIBDIR/libQt5Xml.so* lib

# add libicu, which is required by Qt5 for unicode support
cp --no-dereference $LIBDIR/libicuuc.so* lib
cp --no-dereference $LIBDIR/libicui18n.so* lib
cp --no-dereference $LIBDIR/libicudata.so* lib

# add a couple of libraries which are not installed by default on Ubuntu
cp --no-dereference $LIBDIR/libdouble-conversion.so* lib
cp --no-dereference $LIBDIR/libxcb-xinerama.so* lib

# add openssl from the build system, as this seems to create some problems if the wrong version
cp --no-dereference $LIBDIR/libssl.so* lib
cp --no-dereference $LIBDIR/libcrypto.so* lib

# add poppler libs
# cp --no-dereference $LIBDIR/libpoppler.so* lib
# cp --no-dereference $LIBDIR/libpoppler-cpp.so* lib

# add dependencies of poppler that are on Ubuntu 18.04,
# but maybe not other distros...
# cp --no-dereference $LIBDIR/libgraphite2.so.3* lib
# cp --no-dereference $LIBDIR/libharfbuzz.so.0* lib
# cp --no-dereference $LIBDIR/libjbig.so.0* lib
# cp --no-dereference $LIBDIR/libjpeg.so.8* lib
# cp --no-dereference $LIBDIR/liblcms2.so.2* lib
# cp --no-dereference $LIBDIR/libpng16.so.16* lib
# cp --no-dereference $SYSLIBDIR/libz.so.1* lib

# add Qt plugins used by TikZiT
cp -R $PLUGINDIR/platforms plugins
cp -R $PLUGINDIR/imageformats plugins
cp -R $PLUGINDIR/platforminputcontexts plugins
cp -R $PLUGINDIR/xcbglintegrations plugins

# create tar.gz
cd ..
tar czf tikzit.tar.gz tikzit

