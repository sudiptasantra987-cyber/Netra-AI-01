# ============================================================================
# NETRA AI - COMPLETE SYSTEM LAUNCHER (FastAPI Backend + React Vite Frontend)
# ============================================================================

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location -Path $PSScriptRoot

# Refresh PATH for Node and Python in current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   NETRA AI: Eye-Health Screening & Care-Navigation" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Run unified launcher with live output and graceful cleanup
python run.py
