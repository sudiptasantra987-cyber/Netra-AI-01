#!/usr/bin/env python3
"""
===============================================================================
NETRA AI - Complete Fullstack System Launcher for IDE & Terminal
===============================================================================
This runnable entry point launches both:
  1. Python FastAPI Backend (http://127.0.0.1:8000)
  2. React Vite Frontend (http://localhost:5173)

Compatible with:
  - VS Code & Antigravity IDE (Click 'Run Python File' or F5)
  - PyCharm, Cursor, WebStorm
  - Windows PowerShell, CMD, Linux & macOS Terminals
===============================================================================
"""

import os
import sys
import time
import shutil
import signal
import socket
import threading
import subprocess
import webbrowser
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# ANSI Colors for terminal output
COLOR_CYAN = "\033[96m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_BLUE = "\033[94m"
COLOR_RED = "\033[91m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"

processes = []
is_shutting_down = False

def log(tag: str, msg: str, color: str = COLOR_RESET):
    print(f"{color}{COLOR_BOLD}[{tag}]{COLOR_RESET} {msg}", flush=True)

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def kill_process_on_port(port: int):
    """Attempt to free up port if occupied on Windows"""
    if sys.platform == "win32":
        try:
            cmd = f'netstat -ano | findstr :{port}'
            output = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in output.strip().splitlines():
                parts = line.strip().split()
                if len(parts) >= 5 and "LISTENING" in parts:
                    pid = parts[-1]
                    if pid and pid != "0":
                        subprocess.run(f'taskkill /F /T /PID {pid}', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        log("SYSTEM", f"Terminated existing stale process tree on port {port} (PID {pid})", COLOR_YELLOW)
                        time.sleep(0.5)
        except Exception:
            pass

def stream_output(proc: subprocess.Popen, tag: str, color: str):
    """Streams output from a subprocess line by line with tagged formatting."""
    try:
        for line in iter(proc.stdout.readline, ''):
            if is_shutting_down:
                break
            if line:
                clean_line = line.rstrip()
                print(f"{color}[{tag}]{COLOR_RESET} {clean_line}", flush=True)
    except Exception:
        pass

def cleanup(signum=None, frame=None):
    """Cleanly terminate child processes on exit."""
    global is_shutting_down
    if is_shutting_down:
        return
    is_shutting_down = True
    print()
    log("SYSTEM", "Stopping all Netra AI services gracefully...", COLOR_YELLOW)
    
    for p in processes:
        try:
            if p.poll() is None:
                if sys.platform == "win32":
                    subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    p.terminate()
        except Exception:
            pass

    log("SYSTEM", "Netra AI services stopped cleanly. Goodbye!", COLOR_GREEN)
    sys.exit(0)

def main():
    # Register shutdown signals
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)

    print(f"{COLOR_CYAN}{COLOR_BOLD}")
    print("=" * 65)
    print("    NETRA AI - Clinical Eye Screening & Care-Navigation Platform")
    print("=" * 65)
    print(f"{COLOR_RESET}")

    # 1. Check prerequisites
    python_exe = sys.executable
    log("SYSTEM", f"Python Runtime: {sys.version.split()[0]} ({python_exe})", COLOR_BLUE)

    npm_cmd = shutil.which("npm.cmd") if sys.platform == "win32" else shutil.which("npm")
    if not npm_cmd:
        # Fallback search on Windows
        possible_npm = [
            Path(os.environ.get("ProgramFiles", "")) / "nodejs" / "npm.cmd",
            Path(os.environ.get("ProgramFiles(x86)", "")) / "nodejs" / "npm.cmd",
            Path(os.environ.get("APPDATA", "")) / "npm" / "npm.cmd",
        ]
        for p in possible_npm:
            if p.exists():
                npm_cmd = str(p)
                break

    if not npm_cmd:
        log("ERROR", "Node.js / npm not found! Please install Node.js (v18+) to run the frontend.", COLOR_RED)
        sys.exit(1)

    log("SYSTEM", f"Node/NPM Runtime: {npm_cmd}", COLOR_BLUE)

    # 2. Check and free ports if needed
    if is_port_in_use(8000):
        log("PORT", "Port 8000 is occupied. Attempting to free it...", COLOR_YELLOW)
        kill_process_on_port(8000)

    if is_port_in_use(5173):
        log("PORT", "Port 5173 is occupied. Attempting to free it...", COLOR_YELLOW)
        kill_process_on_port(5173)

    # 3. Start Backend
    log("BACKEND", "Starting Python FastAPI server on http://127.0.0.1:8000...", COLOR_CYAN)
    backend_env = os.environ.copy()
    backend_env["PYTHONUNBUFFERED"] = "1"
    
    backend_proc = subprocess.Popen(
        [
            python_exe,
            "-m", "uvicorn",
            "app.main:app",
            "--host", "127.0.0.1",
            "--port", "8000",
            "--reload"
        ],
        cwd=str(BACKEND_DIR),
        env=backend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    t_backend = threading.Thread(
        target=stream_output, 
        args=(backend_proc, "BACKEND", COLOR_CYAN), 
        daemon=True
    )
    t_backend.start()

    # Small pause to allow FastAPI startup
    time.sleep(1.5)

    # 4. Start Frontend
    log("FRONTEND", "Starting React Vite server on http://localhost:5173...", COLOR_GREEN)
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(frontend_proc)

    t_frontend = threading.Thread(
        target=stream_output, 
        args=(frontend_proc, "FRONTEND", COLOR_GREEN), 
        daemon=True
    )
    t_frontend.start()

    # 5. Open browser once ready
    def open_browser():
        time.sleep(3.0)
        log("SYSTEM", "Opening Netra AI in your default browser: http://localhost:5173", COLOR_BOLD + COLOR_GREEN)
        try:
            webbrowser.open("http://localhost:5173")
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    log("SYSTEM", "All services started! Press Ctrl+C in this terminal to stop all servers.\n", COLOR_BOLD)

    # Keep main thread alive and monitor processes
    try:
        while True:
            time.sleep(0.5)
            if backend_proc.poll() is not None:
                log("BACKEND", f"Backend exited with code {backend_proc.returncode}", COLOR_RED)
                break
            if frontend_proc.poll() is not None:
                log("FRONTEND", f"Frontend exited with code {frontend_proc.returncode}", COLOR_RED)
                break
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()

if __name__ == "__main__":
    main()
