mkdir dist
cd dist
mkdir tikzit
cd tikzit
mkdir icons

copy ..\..\tikzfiles.reg .
copy ..\..\release\tikzit.exe .
copy ..\..\images\tikzdoc.ico icons\
copy C:\Windows\System32\msvcp140.dll .
copy C:\Windows\System32\vcruntime140.dll .

windeployqt.exe --no-compiler-runtime --no-webkit2 --no-angle --no-opengl-sw --no-system-d3d-compiler --no-translations --no-quick-import .\tikzit.exe

cd ..
7z a -tzip tikzit.zip tikzit
cd ..
