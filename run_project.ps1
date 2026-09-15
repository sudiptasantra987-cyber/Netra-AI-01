# ============================================================================
# NETRA AI - COMPLETE SYSTEM LAUNCHER (FastAPI Backend + React Vite Frontend)
# ============================================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   NETRA AI: Eye-Health Screening & Care-Navigation" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# Refresh PATH for Node and Python
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 1. Start FastAPI Backend in background job or separate process
Write-Host "`n[1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendJob = Start-Process -FilePath "python" -ArgumentList "backend/app/main.py" -PassThru -NoNewWindow

Start-Sleep -Seconds 3

# 2. Start Vite Frontend
Write-Host "`n[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Set-Location -Path "frontend"
npm run dev

# Cleanup backend when frontend stops
Stop-Process -Id $BackendJob.Id -Force
