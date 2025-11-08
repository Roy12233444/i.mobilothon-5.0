#!/bin/bash

# EdgeFleet Setup Script
# Automated setup for development environment

echo "================================================"
echo "🚛 EdgeFleet - Automated Setup Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "${YELLOW}Detected Windows environment${NC}"
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

# Function to print success message
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info message
info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check Python installation
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    error "Python not found! Please install Python 3.11+"
    exit 1
fi

# Check Node.js installation
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js found: $NODE_VERSION"
else
    error "Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check npm installation
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm found: v$NPM_VERSION"
else
    error "npm not found! Please install npm"
    exit 1
fi

echo ""
echo "================================================"
echo "Setting up Backend..."
echo "================================================"

# Create directories
info "Creating project directories..."
mkdir -p backend/{models,utils,api,ml}
mkdir -p data
mkdir -p docs/images
success "Directories created"

# Backend setup
cd backend || exit

# Create virtual environment
info "Creating Python virtual environment..."
if $PYTHON_CMD -m venv venv; then
    success "Virtual environment created"
else
    error "Failed to create virtual environment"
    exit 1
fi

# Activate virtual environment
info "Activating virtual environment..."
if [ "$IS_WINDOWS" = true ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
success "Virtual environment activated"

# Install Python dependencies
info "Installing Python dependencies..."
if pip install -r requirements.txt; then
    success "Python dependencies installed"
else
    error "Failed to install Python dependencies"
    exit 1
fi

cd ..

echo ""
echo "================================================"
echo "Setting up Frontend..."
echo "================================================"

# Frontend setup
cd frontend || exit

# Create directories
mkdir -p src/{components,pages,hooks,utils}
mkdir -p public

# Install npm dependencies
info "Installing npm dependencies (this may take a few minutes)..."
if npm install; then
    success "npm dependencies installed"
else
    error "Failed to install npm dependencies"
    exit 1
fi

cd ..

echo ""
echo "================================================"
echo "Creating configuration files..."
echo "================================================"

# Create .env file from example
if [ -f ".env.example" ]; then
    if [ ! -f ".env" ]; then
        info "Creating .env file..."
        cp .env.example .env
        success ".env file created"
    else
        info ".env file already exists, skipping..."
    fi
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
venv/
*.egg-info/

# Node
node_modules/
build/
.env

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF
    success ".gitignore created"
fi

echo ""
echo "================================================"
echo "Initializing database..."
echo "================================================"

# Create data directory
mkdir -p data

info "Database will be created on first run"

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "To start the application:"
echo ""
echo "1. Start Backend:"
echo "   cd backend"
if [ "$IS_WINDOWS" = true ]; then
    echo "   source venv/Scripts/activate"
else
    echo "   source venv/bin/activate"
fi
echo "   uvicorn main:app --reload"
echo ""
echo "2. Start Frontend (new terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Start Simulator (new terminal):"
echo "   cd backend"
if [ "$IS_WINDOWS" = true ]; then
    echo "   source venv/Scripts/activate"
else
    echo "   source venv/bin/activate"
fi
echo "   python utils/simulator.py"
echo ""
echo "Or use Docker:"
echo "   docker-compose up --build"
echo ""
echo "Access the application at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "================================================"
echo "Jay Shree Ram! 🙏"
echo "================================================"