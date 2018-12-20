mkdir dist
cd dist
mkdir tikzit
cd tikzit
mkdir icons

copy ..\..\tikzfiles.reg .
copy ..\..\release\tikzit.exe .
copy ..\..\images\tikzdoc.ico icons\
copy ..\..\win32-dist\*.dll .
copy C:\OpenSSL-Win32\bin\libeay32.dll .
copy C:\OpenSSL-Win32\bin\ssleay32.dll .

windeployqt.exe --no-webkit2 --no-angle --no-opengl-sw --no-system-d3d-compiler --no-translations --no-quick-import .\tikzit.exe

cd ..
7z a -tzip tikzit.zip tikzit
cd ..
