@echo off
cd /d "%~dp0.."
if not exist "%~dp0runtime\node.exe" (
  echo Pipeline Node.js is missing. See automation\README.md. >> "%~dp0collection.log"
  exit /b 1
)
if not exist "%~dp0..\.venv\Scripts\python.exe" (
  echo Pipeline Python environment is missing. See automation\README.md. >> "%~dp0collection.log"
  exit /b 1
)
if not exist "%~dp0node_modules\playwright\package.json" (
  echo Pipeline Playwright package is missing. See automation\README.md. >> "%~dp0collection.log"
  exit /b 1
)
"%~dp0runtime\node.exe" "%~dp0collect_portview.cjs" >> "%~dp0collection.log" 2>&1
set "port_status=%errorlevel%"
"%~dp0runtime\node.exe" "%~dp0collect_infoodle.cjs" >> "%~dp0collection.log" 2>&1
set "infoodle_status=%errorlevel%"
if not "%port_status%"=="0" goto :failed
if not "%infoodle_status%"=="0" goto :failed
"%~dp0..\.venv\Scripts\python.exe" "%~dp0refresh_report.py" >> "%~dp0collection.log" 2>&1
if errorlevel 1 (
  echo Daily CSV refresh failed. Close it in Excel and retry. >> "%~dp0collection.log"
  exit /b 1
)
"%~dp0..\.venv\Scripts\python.exe" "%~dp0prepare_michael_report.py" "%~dp0michael_report_data.tmp.json" >> "%~dp0collection.log" 2>&1
if errorlevel 1 (
  echo Excel report preparation failed. The previous workbook was kept. >> "%~dp0collection.log"
  exit /b 1
)
if not exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  echo Excel report tool unavailable. The CSV is updated but the previous workbook was kept. >> "%~dp0collection.log"
  exit /b 1
)
if not exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\@oai\artifact-tool\package.json" (
  echo Excel report tool unavailable. The CSV is updated but the previous workbook was kept. >> "%~dp0collection.log"
  exit /b 1
)
"%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0build_report.mjs" >> "%~dp0collection.log" 2>&1
if errorlevel 1 (
  del "%~dp0michael_report_data.tmp.json" 2>nul
  echo Excel report refresh failed. Close it in Excel and retry; the previous workbook was kept. >> "%~dp0collection.log"
  exit /b 1
)
del "%~dp0michael_report_data.tmp.json" 2>nul
echo Both daily CSV and Excel report refreshed successfully. >> "%~dp0collection.log"
exit /b 0
:failed
echo Collection failed; reports were not refreshed. >> "%~dp0collection.log"
exit /b 1
