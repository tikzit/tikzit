mkdir dist
cd dist
mkdir tikzit
cd tikzit
mkdir icons

copy ..\..\tikzfiles.reg .
copy ..\..\release\tikzit.exe .
copy ..\..\images\tikzdoc.ico icons\
:: copy ..\..\win32-deps\bin\*.dll .
:: copy ..\..\poppler-21.11.0\Library\bin\*.dll .

windeployqt.exe --xml --no-webkit2 --no-angle --no-opengl-sw --no-system-d3d-compiler --no-translations --no-quick-import .\tikzit.exe

cd ..
7z a -tzip tikzit.zip tikzit
cd ..
