@echo off
REM Start 9Router AI Gateway for Windows
set PORT=20128
set HOSTNAME=0.0.0.0
set NODE_ENV=production
9router --log --skip-update %*
