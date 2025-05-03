#!/bin/bash

# Netwise GitHub Push Script
# This script helps upload the Netwise ISP Management System to GitHub

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "███╗   ██╗███████╗████████╗██╗    ██╗██╗███████╗███████╗"
echo "████╗  ██║██╔════╝╚══██╔══╝██║    ██║██║██╔════╝██╔════╝"
echo "██╔██╗ ██║█████╗     ██║   ██║ █╗ ██║██║███████╗█████╗  "
echo "██║╚██╗██║██╔══╝     ██║   ██║███╗██║██║╚════██║██╔══╝  "
echo "██║ ╚████║███████╗   ██║   ╚███╔███╔╝██║███████║███████╗"
echo "╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${BLUE}Netwise ISP Management System - GitHub Push Script${NC}"
echo -e "${BLUE}------------------------------------------------${NC}"
echo ""

# Function to show progress
progress() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to show success
success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show warning
warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show error and exit
error() {
  echo -e "${RED}[ERROR]${NC} $1"
  exit 1
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    error "Git is not installed. Please install git first."
fi

# Check if the current directory is a git repository
if [ ! -d .git ]; then
    progress "Initializing git repository..."
    git init
    success "Git repository initialized."
else
    success "Git repository already exists."
fi

# Ask for GitHub username
read -p "Enter your GitHub username: " github_username
if [ -z "$github_username" ]; then
    error "GitHub username cannot be empty."
fi

# Ask for repository name
read -p "Enter repository name (default: netwise): " repo_name
repo_name=${repo_name:-netwise}

# Ask if repository should be private
read -p "Make repository private? (yes/no, default: yes): " is_private
is_private=${is_private:-yes}

if [ "$is_private" = "yes" ]; then
    private_flag="--private"
else
    private_flag="--public"
fi

# Ask for Personal Access Token (PAT)
read -p "Enter your GitHub Personal Access Token (will not be displayed): " -s github_token
echo ""
if [ -z "$github_token" ]; then
    error "GitHub token cannot be empty."
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    progress "Creating .gitignore file..."
    cat > .gitignore << 'EOL'
# Node.js dependencies
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# IDE and editor files
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log

# Database files
*.sqlite
*.sqlite3
*.db

# Temporary files
tmp/
temp/

# Replit specifics
.replit
.cache/
.config/
replit.nix
.breakpoints
EOL
    success "Created .gitignore file."
fi

# Stage all files
progress "Staging files for commit..."
git add --all
success "Files staged."

# Make initial commit
progress "Creating initial commit..."
git commit -m "Initial commit: Netwise ISP Management System"
success "Commit created."

# Create repository on GitHub via API
progress "Creating GitHub repository: $repo_name..."
curl -X POST -H "Authorization: token $github_token" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d "{\"name\":\"$repo_name\",\"private\":$([ "$is_private" = "yes" ] && echo "true" || echo "false"),\"description\":\"Netwise ISP Management System - Comprehensive telecommunications and ISP management solution\"}"

# Check if repository creation was successful
if [ $? -ne 0 ]; then
    error "Failed to create GitHub repository. Check your token permissions and try again."
fi

success "GitHub repository created."

# Add remote origin
progress "Adding remote origin..."
git remote add origin https://${github_token}@github.com/${github_username}/${repo_name}.git
success "Remote origin added."

# Push to GitHub
progress "Pushing to GitHub..."
git push -u origin main || git push -u origin master
success "Code pushed to GitHub successfully!"

echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}Repository uploaded to GitHub successfully!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo -e "Your repository is available at: ${BLUE}https://github.com/${github_username}/${repo_name}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up any required GitHub secrets for CI/CD"
echo "2. Configure branch protection rules if needed"
echo "3. Invite collaborators to your repository"
echo ""

exit 0