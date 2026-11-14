@echo off
title Update seafarers report
 echo Checking PortView and Infoodle. This may take a minute...
call "%~dp0collect_daily.cmd"
if errorlevel 1 (
  echo.
  echo The update did not finish. Check automation\collection.log for details.
  echo If either report is open in Excel, close it and try again.
) else (
  echo.
  echo Update complete. The daily CSV and Excel workbook have been refreshed.
)
pause
