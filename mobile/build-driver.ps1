# build-driver.ps1 - Build the Driver (Captain) APK
param([switch]$Install)

$ErrorActionPreference = "Stop"
$JAVA_HOME = "C:\Users\andrew\AppData\Local\Programs\Java\jdk-17.0.20+8"
$ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME
$env:PATH = "$JAVA_HOME\bin;$ANDROID_HOME\platform-tools;$env:PATH"

$CLONE = "C:\pb"
$MOBILE = "$CLONE\mobile"

Write-Host "=== Building PointBreak Captain (Driver) APK ===" -ForegroundColor Cyan

# Clone fresh
if (Test-Path $CLONE) { Remove-Item $CLONE -Recurse -Force }
git clone https://github.com/fijirealmproperties-star/pointbreak-fiji.git $CLONE 2>&1 | Out-Null

# Swap app.json to driver config
Copy-Item "$MOBILE\app.json" "$MOBILE\app.json.bak" -Force
Copy-Item "$MOBILE\app.driver.json" "$MOBILE\app.json" -Force

# Install & prebuild
Set-Location $MOBILE
npm ci 2>&1 | Out-Null
npx expo prebuild --platform android --clean 2>&1

# Build
Set-Location "$MOBILE\android"
& .\gradlew.bat assembleRelease --no-daemon --console=plain 2>&1

# Copy APK
$apk = "$MOBILE\android\app\build\outputs\apk\release\app-release.apk"
$dest = "$env:USERPROFILE\Downloads\PointBreak-Captain.apk"
Copy-Item $apk $dest -Force
Write-Host "`n=== CAPTAIN APK ready: $dest ===" -ForegroundColor Green

# Install on phone if connected
if ($Install) {
    & "$ANDROID_HOME\platform-tools\adb.exe" shell pm uninstall com.pointbreak.driver 2>&1 | Out-Null
    & "$ANDROID_HOME\platform-tools\adb.exe" push $dest /data/local/tmp/ 2>&1 | Out-Null
    $result = & "$ANDROID_HOME\platform-tools\adb.exe" shell pm install /data/local/tmp/PointBreak-Captain.apk 2>&1
    if ($result -match "Success") {
        & "$ANDROID_HOME\platform-tools\adb.exe" shell am start -n com.pointbreak.driver/.MainActivity 2>&1 | Out-Null
        Write-Host "=== Installed & launched on phone ===" -ForegroundColor Green
    }
}

# Cleanup
Remove-Item $CLONE -Recurse -Force -ErrorAction SilentlyContinue
