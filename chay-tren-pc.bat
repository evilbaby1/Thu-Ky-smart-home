@echo off
REM ============================================================
REM  Thu Ky - chay thu tren may tinh (Chrome app mode)
REM  Double-click file nay, hoac: chay-tren-pc.bat
REM ============================================================
setlocal
cd /d "%~dp0"

echo [1/3] Kiem tra dependencies...
if not exist "node_modules" (
  echo Dang cai npm install...
  call npm install
  if errorlevel 1 (
    echo Loi npm install. Cai Node.js truoc nha.
    pause
    exit /b 1
  )
)

echo [2/3] Build web (neu can)...
if not exist "dist\index.html" (
  call npm run build
  if errorlevel 1 (
    echo Loi build.
    pause
    exit /b 1
  )
)

echo [3/3] Mo Chrome o che do app (mo dien thoai)...
REM Uu tien Chrome, sau do Edge
set CHROME=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

REM Port 5173 + localhost = trung CORS da cau hinh trong Home Assistant
REM (127.0.0.1:4173 bi HA tra 403 CORS)
start "ThuKy-Preview" /min cmd /c "npm run preview -- --host 0.0.0.0 --port 5173"
timeout /t 2 /nobreak >nul
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /c:"IPv4"') do set LANIP=%%i

if defined CHROME (
  start "" "%CHROME%" --app=http://localhost:5173/ --window-size=960,540 --user-data-dir="%~dp0.chrome-thuky"
) else (
  start "" http://localhost:5173/
)

echo.
echo Dang chay: http://localhost:5173
echo May khac / man Samsung cung mang LAN mo: http://%LANIP%:5173
echo (KHONG dung 127.0.0.1:4173 — HA chan CORS origin do)
echo.
echo Trong app: Cai dat ^> URL: http://192.168.1.13  (khong co :8123)
echo Nhan mic hoac cham man hinh de bat giong noi.
echo.
pause
