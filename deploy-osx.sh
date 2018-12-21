# deploy the Mac app bundle. Note the bin/ directory
# of Qt should be in your PATH

macdeployqt tikzit.app
hdiutil create -volname TikZiT -srcfolder tikzit.app -ov -format UDZO tikzit.dmg


