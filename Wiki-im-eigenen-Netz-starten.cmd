@echo off
REM ===================================================================
REM  Startet das Wiki im eigenen NetBird-Netz.
REM
REM  Doppelklick genuegt. Danach ist das Wiki von jedem Geraet
REM  erreichbar, das in deinem NetBird-Netz eingetragen ist -
REM  solange dieser PC laeuft und dieses Fenster offen ist.
REM
REM  Zum Beenden: Fenster schliessen oder Strg + C.
REM ===================================================================
setlocal
cd /d "%~dp0"

echo.
echo   Age of Beast - Wiki im eigenen Netz
echo   ===================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   Node.js wurde nicht gefunden.
  echo   Ohne Node.js kann der Server nicht starten.
  echo.
  pause
  exit /b 1
)

node werkzeuge\heim-server.mjs

echo.
echo   Server beendet.
pause
