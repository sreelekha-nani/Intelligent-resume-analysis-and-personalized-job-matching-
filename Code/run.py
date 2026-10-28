import os
import sys
import subprocess
import time
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def start_services():
    processes = []
    print("=" * 60)
    print("🚀 Starting AI-Powered Job Recommendation System")
    print("=" * 60)

    # 1. Start Backend FastAPI
    print("[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "main.py"],
        cwd=str(BACKEND_DIR)
    )
    processes.append(backend_proc)

    # 2. Start Frontend Vite
    backend_only = "--backend-only" in sys.argv
    if not backend_only and FRONTEND_DIR.exists():
        print("[2/2] Launching React Frontend on http://localhost:3000 ...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR)
        )
        processes.append(frontend_proc)

    print("\n" + "-" * 60)
    print("✨ Services Running:")
    print("   👉 Web App (Frontend): http://localhost:3000")
    print("   👉 API Server:         http://127.0.0.1:8000")
    print("   👉 Swagger API Docs:   http://127.0.0.1:8000/docs")
    print("   Press Ctrl+C to stop all servers.")
    print("-" * 60 + "\n")

    try:
        while True:
            for p in processes:
                if p.poll() is not None:
                    return
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping all services...")
    finally:
        for p in processes:
            if p.poll() is None:
                p.terminate()
                try:
                    p.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    p.kill()
        print("✅ Stopped.")

if __name__ == "__main__":
    start_services()
