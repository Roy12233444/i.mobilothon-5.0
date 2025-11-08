# Setup Python Virtual Environment Script
# Run this script as Administrator

# Configuration
$pythonVersion = "3.10"
$venvName = "venv"
$projectRoot = $PSScriptRoot
$requirementsFile = "ml/requirements.txt"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Check Python version
Write-Host "🔍 Checking Python $pythonVersion installation..." -ForegroundColor Cyan
$pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
$pythonVersionOutput = python --version 2>&1

if (-not $pythonVersionOutput -or -not $pythonVersionOutput.Contains("Python $pythonVersion")) {
    Write-Host "❌ Python $pythonVersion is not installed or not in PATH" -ForegroundColor Red
    Write-Host "   Please install Python $pythonVersion from https://www.python.org/downloads/"
    Write-Host "   Make sure to check 'Add Python to PATH' during installation."
    exit 1
}

Write-Host "✅ Found $pythonVersion" -ForegroundColor Green

# Create virtual environment
Write-Host "🚀 Creating virtual environment..." -ForegroundColor Cyan
if (Test-Path "$projectRoot\$venvName") {
    Write-Host "⚠️ Virtual environment '$venvName' already exists. Removing it..." -ForegroundColor Yellow
    Remove-Item -Path "$projectRoot\$venvName" -Recurse -Force
}

python -m venv "$projectRoot\$venvName" --python=$pythonVersion

if (-not (Test-Path "$projectRoot\$venvName")) {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Virtual environment created successfully" -ForegroundColor Green

# Activate virtual environment and install requirements
Write-Host "📦 Installing requirements..." -ForegroundColor Cyan
$activateScript = "$projectRoot\$venvName\Scripts\Activate.ps1"

if (-not (Test-Path $activateScript)) {
    Write-Host "❌ Could not find activation script" -ForegroundColor Red
    exit 1
}

# Create a temporary script to run in the virtual environment
$tempScript = [System.IO.Path]::GetTempFileName() + ".ps1"
@"
# Activate virtual environment
& "$activateScript"

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
if (Test-Path "$projectRoot\$requirementsFile") {
    pip install -r "$projectRoot\$requirementsFile"
} else {
    Write-Host "⚠️ Requirements file not found: $requirementsFile" -ForegroundColor Yellow
}

# Verify installation
Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "To activate the virtual environment, run:" -ForegroundColor Cyan
Write-Host "  .\$venvName\Scripts\activate`n" -ForegroundColor White
Write-Host "To deactivate, simply type 'deactivate'`n" -ForegroundColor Cyan
"@ | Out-File -FilePath $tempScript -Encoding utf8

# Run the temporary script in the current PowerShell session
. $tempScript

# Clean up
Remove-Item $tempScript -Force

# Keep the window open
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
