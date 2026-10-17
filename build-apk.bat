@echo off
REM ============================================================
REM  Thu Ky - Build APK (can Android Studio + JDK 17)
REM ============================================================
setlocal
cd /d "%~dp0"

echo ============================================
echo  BUILD APK - Thu Ky Smart Home
echo ============================================
echo.
echo Dieu kien truoc khi build:
echo   1. JDK 17 (Microsoft OpenJDK hoac Temurin)
echo   2. Android Studio (hoac Android SDK + build-tools)
echo   3. Android SDK platform 34
echo.

REM Kiem tra java
where java >nul 2>nul
if errorlevel 1 (
  echo [!] Khong tim thay Java.
  echo.
  echo Cai nhanh bang winget:
  echo   winget install Microsoft.OpenJDK.17
  echo   winget install Google.AndroidStudio
  echo.
  echo Sau do mo Android Studio ^> SDK Manager ^> cai "Android 14 (API 34)".
  echo Roi chay lai file nay.
  echo.
  pause
  exit /b 1
)

java -version 2>&1 | findstr /i "version" >nul
echo [1/4] Java: OK
echo [2/4] Sync web vao Android...
call npm run build
if errorlevel 1 exit /b 1
call npx cap sync android
if errorlevel 1 exit /b 1

echo [3/4] Gradle assembleDebug...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
  echo.
  echo [!] Gradle loi. Mo Android Studio chon thu muc:
  echo     F:\AIsource\AppsmartHome\android
  echo   Roi Build ^> Build APK(s)
  pause
  exit /b 1
)

echo [4/4] Xong!
echo APK nam tai:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Copy vao dien thoai ^> cai ^> cho phep micro ^> chay.
echo.
pause
