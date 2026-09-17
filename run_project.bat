@echo off
title Netra AI - Healthcare Platform
echo =========================================================
echo    NETRA AI: Eye-Health Screening & Care Navigation
echo =========================================================
echo.

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

python run.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo Application stopped with an error.
    pause
)
