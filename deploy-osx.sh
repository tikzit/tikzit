# deploy the Mac app bundle. Note the bin/ directory
# of Qt should be in your PATH

# copy in libraries and set (most) library paths
macdeployqt tikzit.app

# macdeployqt misses this path for some reason, so fix it
cd tikzit.app/Contents/Frameworks

POPPLER_QT=`ls libpoppler-qt*`
POPPLER_PATH=`otool -L $POPPLER_QT | sed -e 'm!.*\(/usr.*\(libpoppler\..*dylib\)\).*!\1!p'`
POPPLER_LIB=`otool -L $POPPLER_QT | sed -e 'm!.*\(/usr.*\(libpoppler\..*dylib\)\).*!\2!p'`

echo "Found $POPPLER_QT and $POPPLER_LIB"
echo "Replacing $POPPLER_PATH with relative path..."

install_name_tool -id "@executable_path/../Frameworks/$POPPLER_LIB" $POPPLER_LIB
install_name_tool -change $POPPLER_PATH "@executable_path/../Frameworks/$POPPLER_LIB" $POPPLER_QT

cd ../../..

# create DMG
hdiutil create -volname TikZiT -srcfolder tikzit.app -ov -format UDZO tikzit.dmg


