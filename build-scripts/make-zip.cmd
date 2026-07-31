@echo off
cd ..
setlocal
where /q 7z
IF ERRORLEVEL 1 (
    set ZIP_BIN="C:\Program Files\7-Zip\7z.exe"
) ELSE (
    set ZIP_BIN=7z
)
for /f %%a in ('powershell -Command "Get-Date -format yyyyMMdd"') do set TODAY=%%a
set ZIP_NAME=VRCX_%TODAY%.zip
echo %ZIP_NAME%
rem using 7-Zip (https://www.7-zip.org)
cd "%~dp0\..\build\Cef"
%ZIP_BIN% a -tzip %ZIP_NAME% * -mx=7 -xr0!*.log -xr0!*.pdb -xr!locales -xr!dxcompiler.dll -xr!vk_swiftshader.dll -xr!vk_swiftshader_icd.json -xr!Microsoft.Windows.SDK.NET.dll -xr!WinRT.Runtime.dll
%ZIP_BIN% a -tzip %ZIP_NAME% locales\en-US.pak locales\zh-CN.pak locales\zh-TW.pak -mx=7
cd "%~dp0"
move "%~dp0\..\build\Cef\%ZIP_NAME%" "%~dp0"
pause
