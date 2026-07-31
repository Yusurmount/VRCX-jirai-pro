$ErrorActionPreference = "Stop"

# Visual Studio is not required; .NET SDK handles the build directly.
# $installPath = &"C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe" -version 16.0 -property installationpath
# Import-Module (Join-Path $installPath "Common7\Tools\Microsoft.VisualStudio.DevShell.dll")
# Enter-VsDevShell -VsInstallPath $installPath -SkipAutomaticLocation

$version = (Get-Content -Path "Version" -Raw).Trim()
$ZipName = "VRCX-Pro_Portable_$version.zip"
$SetupName = "VRCX-Pro_Setup_$version.exe"
New-Item -ItemType Directory -Path "Release" -Force | Out-Null

Write-Host "构建 .Net 中..." -ForegroundColor Green
dotnet build Dotnet\VRCX-Cef.csproj -p:Configuration=Release -p:WarningLevel=0 -p:Platform=x64 -p:RestorePackagesConfig=true -t:"Restore;Clean;Build" -m

Write-Host "构建 Node.js 中..." -ForegroundColor Green
Remove-Item -Path "node_modules" -Force -Recurse -ErrorAction SilentlyContinue
npm install --ignore-scripts --loglevel=error
$ErrorActionPreference = "Continue"
npm run prod
$ErrorActionPreference = "Stop"
Remove-Item -Path "build\Cef\html" -Force -Recurse -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "build\Cef\html" -Target "build\html"

#Write-Host "Creating Zip..." -ForegroundColor Green
#cd "build\Cef"
## Exclude unneeded CEF files to slim the package; re-add only required locale packs.
## Use an argument array: inline "-xr!dxcompiler.dll" gets misparsed by PowerShell 5.1.
#$7z = "G:\Program Files\7-Zip\7z.exe"
#& $7z @('a', '-tzip', $ZipName, '*', '-mx=7', '-xr0!*.log', '-xr0!*.pdb', '-xr!locales', '-xr!dxcompiler.dll', '-xr!vk_swiftshader.dll', '-xr!vk_swiftshader_icd.json', '-xr!Microsoft.Windows.SDK.NET.dll', '-xr!WinRT.Runtime.dll')
#& $7z @('a', '-tzip', $ZipName, 'locales\en-US.pak', 'locales\zh-CN.pak', 'locales\zh-TW.pak', '-mx=7')
#Move-Item $ZipName ..\..\Release\$ZipName -Force
#cd ..\..\

Write-Host "构建安装包中..." -ForegroundColor Green
cd "Installer"
Out-File -FilePath "version_define.nsh" -Encoding UTF8 -InputObject "!define PRODUCT_VERSION_FROM_FILE `"$version.0`""
$nsisPath = "C:\Program Files (x86)\NSIS\makensis.exe"
&$nsisPath installer.nsi
Start-Sleep -Seconds 1
Move-Item VRCX-Pro_Setup.exe ..\Release\$SetupName -Force
cd ..

Write-Host "计算 SHA256 中..." -ForegroundColor Green
$hash = Get-FileHash -Path "Release\$SetupName" -Algorithm SHA256
$hashLine = "$($hash.Hash)  $SetupName"
$hashLine | Out-File -FilePath "SHA256SUMS.txt" -Encoding ASCII

Write-Host "完成!" -ForegroundColor Green
