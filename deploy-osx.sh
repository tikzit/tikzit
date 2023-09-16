# deploy the Mac app bundle. Note the bin/ directory
# of Qt should be in your PATH

# copy in libraries and set (most) library paths
macdeployqt tikzit.app

# macdeployqt doesn't fix the path to libpoppler for some reason, so we do it by hand
cd tikzit.app/Contents/Frameworks

# POPPLER_CPP=`ls libpoppler-cpp*`
# POPPLER_PATH=`otool -L $POPPLER_CPP | sed -n 's!.*\(/usr.*\(libpoppler\..*dylib\)\).*!\1!p'`
# POPPLER_LIB=`otool -L $POPPLER_CPP | sed -n 's!.*\(/usr.*\(libpoppler\..*dylib\)\).*!\2!p'`

# echo "Found $POPPLER_CPP and $POPPLER_LIB"

# if [ "$POPPLER_PATH" != "" ]; then
#   echo "Replacing $POPPLER_PATH with relative path..."
#   install_name_tool -id "@executable_path/../Frameworks/$POPPLER_LIB" $POPPLER_LIB
#   install_name_tool -change $POPPLER_PATH "@executable_path/../Frameworks/$POPPLER_LIB" $POPPLER_CPP
# else
#   echo "Poppler already has relative path, so nothing to do."
# fi


cd ../../..

# create DMG
hdiutil create -volname TikZiT -srcfolder tikzit.app -ov -format UDZO tikzit.dmg


