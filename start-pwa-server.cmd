@echo off
setlocal
cd /d "%~dp0"

echo.
echo === Technical English Coach: Offline-PWA aktualisieren ===
echo.
echo 1/4 Erzeuge lokales HTTPS-Zertifikat fuer dieses WLAN.
call npm run pwa:cert
if errorlevel 1 (
  echo.
  echo Fehler beim Zertifikat-Build. Bitte Ausgabe pruefen.
  pause
  exit /b 1
)

echo.
echo 2/4 Pruefe lokales HTTPS-Zertifikat.
call npm run pwa:cert:check
if errorlevel 1 (
  echo.
  echo Fehler beim Zertifikat-Check. Bitte Ausgabe pruefen.
  pause
  exit /b 1
)

echo.
echo 3/4 Baue lokalen Web-Export mit deinen privaten lokalen Inhalten.
call npm run pwa:build
if errorlevel 1 (
  echo.
  echo Fehler beim PWA-Build. Bitte Ausgabe pruefen.
  pause
  exit /b 1
)

echo.
echo 4/4 Pruefe Offline-PWA-Dateien.
call npm run pwa:check
if errorlevel 1 (
  echo.
  echo Fehler beim PWA-Check. Bitte Ausgabe pruefen.
  pause
  exit /b 1
)

echo.
echo Server startet jetzt. Die iPhone-URL steht gleich in diesem Fenster.
echo Beim ersten Mal zuerst die Certificate install URL auf dem iPhone oeffnen.
echo Danach Zertifikat in iOS installieren und volles Vertrauen aktivieren.
echo.
call npm run pwa:serve

pause
