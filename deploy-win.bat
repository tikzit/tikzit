mkdir dist
cd dist
mkdir tikzit
cd tikzit
cp ..\..\tikzit.exe .

windeployqt.exe --no-webkit2 --no-angle --no-opengl-sw --no-system-d3d-compiler --no-translations --no-quick-import .\tikzit.exe