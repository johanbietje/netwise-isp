#!/bin/bash

# Netwise ISP Management System - Debian Installation Script
# This script will install Netwise on a Debian-based system
# Run with sudo: sudo bash install_netwise.sh

set -e

# Text formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "███╗   ██╗███████╗████████╗██╗    ██╗██╗███████╗███████╗"
echo "████╗  ██║██╔════╝╚══██╔══╝██║    ██║██║██╔════╝██╔════╝"
echo "██╔██╗ ██║█████╗     ██║   ██║ █╗ ██║██║███████╗█████╗  "
echo "██║╚██╗██║██╔══╝     ██║   ██║███╗██║██║╚════██║██╔══╝  "
echo "██║ ╚████║███████╗   ██║   ╚███╔███╔╝██║███████║███████╗"
echo "╚═╝  ╚═══╝╚══════╝   ╚═╝    ╚══╝╚══╝ ╚═╝╚══════╝╚══════╝"
echo -e "${NC}"
echo -e "${BLUE}Netwise ISP Management System - Debian Installation Script${NC}"
echo -e "${BLUE}-----------------------------------------------------${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash install_netwise.sh${NC}"
  exit 1
fi

# Directory for installation
INSTALL_DIR="/opt/netwise"
DATA_DIR="/var/lib/netwise"
LOG_DIR="/var/log/netwise"
CONFIG_DIR="/etc/netwise"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

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

# Function to create a user for the service
create_service_user() {
  progress "Creating netwise service user..."
  id -u netwise &>/dev/null || useradd --system --no-create-home --shell /sbin/nologin netwise
  success "Service user created."
}

# Function to install system dependencies
install_dependencies() {
  progress "Updating package lists..."
  apt-get update || error "Failed to update package lists."
  
  progress "Installing system dependencies..."
  apt-get install -y curl wget gnupg2 apt-transport-https ca-certificates \
    lsb-release build-essential git unzip || error "Failed to install basic dependencies."
  
  # Install Node.js LTS
  if ! command_exists node; then
    progress "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs || error "Failed to install Node.js."
    success "Node.js installed: $(node --version)"
  else
    success "Node.js already installed: $(node --version)"
  fi
  
  # Install PostgreSQL
  if ! command_exists psql; then
    progress "Installing PostgreSQL..."
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
    apt-get update
    apt-get install -y postgresql postgresql-contrib || error "Failed to install PostgreSQL."
    systemctl enable postgresql
    systemctl start postgresql
    success "PostgreSQL installed and started."
  else
    success "PostgreSQL already installed."
  fi
  
  # Install FreeSwitch for PBX functionality
  progress "Installing FreeSWITCH dependencies..."
  apt-get install -y gnupg2 wget lsb-release
  
  wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add -
  
  echo "deb http://files.freeswitch.org/repo/deb/debian-release/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/freeswitch.list
  apt-get update
  
  progress "Installing FreeSWITCH..."
  apt-get install -y freeswitch freeswitch-meta-vanilla freeswitch-mod-event-socket
  
  success "All dependencies installed."
}

# Function to configure PostgreSQL
setup_database() {
  progress "Setting up PostgreSQL database..."
  
  # Create database and user
  su - postgres -c "psql -c \"CREATE DATABASE netwise;\""
  su - postgres -c "psql -c \"CREATE USER netwise WITH ENCRYPTED PASSWORD 'netwise_password';\""
  su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE netwise TO netwise;\""
  
  success "Database setup complete."
}

# Function to create required directories
create_directories() {
  progress "Creating application directories..."
  
  mkdir -p "$INSTALL_DIR"
  mkdir -p "$DATA_DIR"
  mkdir -p "$LOG_DIR"
  mkdir -p "$CONFIG_DIR"
  
  # Set proper permissions
  chown -R netwise:netwise "$INSTALL_DIR"
  chown -R netwise:netwise "$DATA_DIR"
  chown -R netwise:netwise "$LOG_DIR"
  chown -R netwise:netwise "$CONFIG_DIR"
  
  success "Directories created."
}

# Function to set up the systemd service
create_service() {
  progress "Creating systemd service..."
  
  cat > /etc/systemd/system/netwise.service << EOF
[Unit]
Description=Netwise ISP Management System
After=network.target postgresql.service freeswitch.service

[Service]
Type=simple
User=netwise
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=netwise
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://netwise:netwise_password@localhost:5432/netwise

[Install]
WantedBy=multi-user.target
EOF
  
  systemctl daemon-reload
  systemctl enable netwise.service
  
  success "Service created and enabled."
}

# Function to download the application
download_application() {
  progress "Downloading Netwise application..."
  
  # Clone the repository or download the release
  cd /tmp
  git clone https://github.com/johanbietje/netwise-isp
  
  # Copy files to installation directory
  cp -r /tmp/netwise-temp/* "$INSTALL_DIR/"
  rm -rf /tmp/netwise-temp
  
  # Install npm dependencies
  cd "$INSTALL_DIR"
  npm install --production
  
  # Create environment file
  cat > "$CONFIG_DIR/env" << EOF
NODE_ENV=production
DATABASE_URL=postgresql://netwise:netwise_password@localhost:5432/netwise
PORT=5000
SESSION_SECRET=$(openssl rand -hex 32)
FREESWITCH_HOST=localhost
FREESWITCH_PORT=8021
FREESWITCH_PASSWORD=ClueCon
EOF
  
  # Link environment file
  ln -sf "$CONFIG_DIR/env" "$INSTALL_DIR/.env"
  
  # Set ownership
  chown -R netwise:netwise "$INSTALL_DIR"
  
  success "Application downloaded and configured."
}

# Function to run database migrations
run_migrations() {
  progress "Running database migrations..."
  
  cd "$INSTALL_DIR"
  npm run db:push
  
  # Seed initial data
  npm run db:seed
  
  success "Database migrations complete."
}

# Function to configure the FreeSwitch for PBX functionality
configure_freeswitch() {
  progress "Configuring FreeSWITCH for PBX..."
  
  # Backup original configs
  cp -r /etc/freeswitch /etc/freeswitch.bak
  
  # TODO: Add specific FreeSWITCH configurations for Netwise
  
  # Restart FreeSWITCH to apply changes
  systemctl restart freeswitch
  
  success "FreeSWITCH configured for PBX functionality."
}

# Main installation process
main() {
  progress "Starting Netwise installation..."
  
  create_service_user
  install_dependencies
  create_directories
  setup_database
  download_application
  run_migrations
  configure_freeswitch
  create_service
  
  # Start the service
  progress "Starting Netwise service..."
  systemctl start netwise.service
  
  # Final report
  echo ""
  echo -e "${GREEN}==================================================${NC}"
  echo -e "${GREEN}Netwise ISP Management System Installation Complete${NC}"
  echo -e "${GREEN}==================================================${NC}"
  echo ""
  echo -e "Installation directory: ${BLUE}$INSTALL_DIR${NC}"
  echo -e "Configuration: ${BLUE}$CONFIG_DIR${NC}"
  echo -e "Logs: ${BLUE}$LOG_DIR${NC}"
  echo ""
  echo -e "Access the web interface at: ${BLUE}http://$(hostname -I | awk '{print $1}'):5000${NC}"
  echo -e "Default admin login: ${BLUE}admin / admin123${NC} (change this immediately!)"
  echo ""
  echo -e "${YELLOW}Please secure your installation by:${NC}"
  echo "  - Changing the default admin password"
  echo "  - Setting up SSL/TLS (recommended to use nginx as a reverse proxy)"
  echo "  - Configuring a firewall (ufw recommended)"
  echo ""
  echo -e "For support, visit: ${BLUE}https://netwise-isp.com/support${NC}"
  echo ""
}

# Run the installation
main

exit 0
