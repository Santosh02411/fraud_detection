#!/usr/bin/env python3
"""
Fraud Detection System Startup Script
This script initializes and starts the complete fraud detection system
"""

import os
import sys
import subprocess
import webbrowser
import time
from threading import Thread

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    return True

def install_dependencies():
    """Install required Python dependencies"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def start_backend():
    """Start the Flask backend server"""
    print("🚀 Starting backend server...")
    try:
        # Don't change dir globally, use Cwd in subprocess or full path
        backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
        subprocess.Popen([sys.executable, "run.py"], cwd=backend_dir)
        print("✅ Backend server starting on http://localhost:5000")
        return True
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return False

def start_frontend():
    """Start the Vite dev server for the frontend"""
    print("🌐 Starting frontend dev server...")
    try:
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")
        # Use shell=True for npm on Windows
        subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir, shell=True)
        print("✅ Frontend server starting on http://localhost:5173")
        return True
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return False

def open_browser():
    """Open the application in the default browser"""
    print("🌍 Opening application in browser...")
    time.sleep(5)  # Wait for servers to start
    webbrowser.open("http://localhost:5173")

def main():
    """Main startup function"""
    print("🛡️  FraudGuard - Advanced Fraud Detection System")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return
    
    # Change to project directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Start servers
    if not start_backend():
        return
    
    if not start_frontend():
        return
    
    # Open browser in a separate thread
    browser_thread = Thread(target=open_browser)
    browser_thread.daemon = True
    browser_thread.start()
    
    print("\n🎉 FraudGuard is now running!")
    print("📱 Frontend: http://localhost:5173")
    print("🔧 Backend API: http://localhost:5000")
    print("👤 Default Admin: admin / admin123")
    print("\n⚠️  Press Ctrl+C to stop the servers")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Shutting down servers...")
        print("✅ FraudGuard stopped successfully")


if __name__ == "__main__":
    main()
