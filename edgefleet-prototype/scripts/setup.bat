@echo off
setlocal enabledelayedexpansion
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

echo ================================================
echo  🚛 EdgeFleet - Setup Script (Windows)
echo  📍 Project Root: %PROJECT_ROOT%
echo ================================================
echo.

REM Check Python installation
echo [1/6] 🔍 Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.11+
    echo        Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
python -c "import sys; exit(0) if sys.version_info >= (3, 11) else exit(1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.11 or higher is required
    pause
    exit /b 1
)
echo [OK] Python !python -V!

REM Check Node.js installation
echo.
echo [2/6] 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    echo         Download: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js !node --version!

REM Check npm installation
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found! Please install npm
    pause
    exit /b 1
)
echo [OK] npm v!npm --version!

echo.
echo ================================================
echo  🛠️  Setting up Backend...
echo ================================================

REM Create directories
echo [3/6] 📂 Creating project directories...
mkdir "backend\models" 2>nul
mkdir "backend\utils" 2>nul
mkdir "backend\api" 2>nul
mkdir "backend\ml" 2>nul
mkdir "data" 2>nul
mkdir "docs\images" 2>nul
echo [OK] Directory structure created

REM Backend setup
cd backend

REM Create virtual environment
echo.
echo [4/6] 🐍 Setting up Python virtual environment...
if not exist "venv" (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)
echo [OK] Virtual environment created

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install Python dependencies
echo.
echo [5/6] 📦 Installing Python dependencies...
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found in backend folder
    pause
    exit /b 1
)
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies failed to install, continuing anyway...
)
echo [OK] Python dependencies installed

cd ..

echo.
echo ================================================
echo  💻 Setting up Frontend...
echo ================================================

cd frontend

REM Create directories
mkdir "src\components" 2>nul
mkdir "src\pages" 2>nul
mkdir "src\hooks" 2>nul
mkdir "src\utils" 2>nul
mkdir "public" 2>nul

REM Install npm dependencies
echo.
echo [6/6] 📦 Installing npm dependencies (this may take a few minutes)...
call npm install
if %errorlevel% neq 0 (
    echo [WARNING] Some npm packages had issues, but continuing...
)

cd ..

echo.
echo ================================================
echo  ✅ Setup Complete!
echo ================================================
echo.
echo To start the application:
echo.
echo 1. Start Backend (new terminal):
echo    cd /d "E:\i.mobilothon 5.0\edgefleet-prototype\backend"
echo    venv\Scripts\activate
echo    uvicorn main:app --reload
echo.
echo 2. Start Frontend (new terminal):
echo    cd /d "E:\i.mobilothon 5.0\edgefleet-prototype\frontend"
echo    npm start
echo.
echo 3. Access the application:
echo    🌐 Frontend: http://localhost:3000
echo    📚 API Docs: http://localhost:8000/docs
echo.
echo ================================================
echo  🚀 Happy Coding! Jay Shree Ram! 🚀
echo ================================================
echo.
pause