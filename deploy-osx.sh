# deploy the Mac app bundle. Note the bin/ directory
# of Qt should be in your PATH

# copy in libraries and set (most) library paths
macdeployqt tikzit.app

# macdeployqt misses this path for some reason, so fix it
cd tikzit.app/Contents/Frameworks
install_name_tool -id "@executable_path/../Frameworks/libpoppler.83.dylib" libpoppler.83.dylib
install_name_tool -change /usr/local/Cellar/poppler/0.72.0/lib/libpoppler.83.dylib "@executable_path/../Frameworks/libpoppler.83.dylib" libpoppler-qt5.1.dylib
cd ../../..

# create DMG
hdiutil create -volname TikZiT -srcfolder tikzit.app -ov -format UDZO tikzit.dmg


