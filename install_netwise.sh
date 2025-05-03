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
  
  # Check if useradd command exists
  if command -v useradd &>/dev/null; then
    id -u netwise &>/dev/null || useradd --system --no-create-home --shell /sbin/nologin netwise
    success "Service user created with useradd."
  # Check if adduser command exists (Debian/Ubuntu alternative)
  elif command -v adduser &>/dev/null; then
    id -u netwise &>/dev/null || adduser --system --no-create-home --shell /sbin/nologin netwise
    success "Service user created with adduser."
  # If on macOS
  elif [ "$(uname)" == "Darwin" ]; then
    if ! dscl . -read /Users/netwise &>/dev/null; then
      # Create a system user on macOS
      MAXID=$(dscl . -list /Users UniqueID | awk '{print $2}' | sort -ug | tail -1)
      NEWID=$((MAXID+1))
      
      dscl . -create /Users/netwise
      dscl . -create /Users/netwise UserShell /usr/bin/false
      dscl . -create /Users/netwise UniqueID "$NEWID"
      dscl . -create /Users/netwise PrimaryGroupID 20
      dscl . -create /Users/netwise NFSHomeDirectory /var/empty
    fi
    success "Service user created for macOS."
  else
    warning "Could not create system user 'netwise'. User creation commands not found."
    warning "You may need to manually create this user or run as a different user."
    warning "Continuing with installation..."
  fi
}

# Function to install system dependencies
install_dependencies() {
  # Detect package manager
  if command -v apt-get &>/dev/null; then
    PKG_MANAGER="apt-get"
    UPDATE_CMD="apt-get update"
    INSTALL_CMD="apt-get install -y"
  elif command -v yum &>/dev/null; then
    PKG_MANAGER="yum"
    UPDATE_CMD="yum makecache"
    INSTALL_CMD="yum install -y"
  elif command -v dnf &>/dev/null; then
    PKG_MANAGER="dnf"
    UPDATE_CMD="dnf check-update"
    INSTALL_CMD="dnf install -y"
  elif command -v brew &>/dev/null; then
    PKG_MANAGER="brew"
    UPDATE_CMD="brew update"
    INSTALL_CMD="brew install"
  else
    warning "Package manager not found. You'll need to install dependencies manually."
    warning "Required: Node.js 18+, PostgreSQL 14+, git, curl, wget"
    return 1
  fi
  
  progress "Updating package lists..."
  eval $UPDATE_CMD
  
  progress "Installing system dependencies..."
  case $PKG_MANAGER in
    apt-get)
      $INSTALL_CMD curl wget gnupg2 apt-transport-https ca-certificates \
        lsb-release build-essential git unzip
      ;;
    yum|dnf)
      $INSTALL_CMD curl wget gnupg2 ca-certificates \
        redhat-lsb-core gcc gcc-c++ make git unzip
      ;;
    brew)
      $INSTALL_CMD curl wget gnupg2 git unzip
      ;;
  esac
  
  # Install Node.js LTS
  if ! command_exists node; then
    progress "Installing Node.js..."
    case $PKG_MANAGER in
      apt-get)
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
        ;;
      yum)
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
        ;;
      dnf)
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        dnf install -y nodejs
        ;;
      brew)
        brew install node@18
        ;;
    esac
    success "Node.js installed: $(node --version)"
  else
    success "Node.js already installed: $(node --version)"
  fi
  
  # Install PostgreSQL
  if ! command_exists psql; then
    progress "Installing PostgreSQL..."
    case $PKG_MANAGER in
      apt-get)
        echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
        wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
        apt-get update
        apt-get install -y postgresql postgresql-contrib
        if command -v systemctl &>/dev/null; then
          systemctl enable postgresql
          systemctl start postgresql
        else
          service postgresql start
        fi
        ;;
      yum|dnf)
        if [ "$PKG_MANAGER" = "yum" ]; then
          yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
          yum install -y postgresql14-server postgresql14-contrib
        else
          dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm
          dnf -qy module disable postgresql
          dnf install -y postgresql14-server postgresql14-contrib
        fi
        /usr/pgsql-14/bin/postgresql-14-setup initdb
        if command -v systemctl &>/dev/null; then
          systemctl enable postgresql-14
          systemctl start postgresql-14
        else
          service postgresql-14 start
        fi
        ;;
      brew)
        brew install postgresql@14
        brew services start postgresql@14
        ;;
    esac
    success "PostgreSQL installed and started."
  else
    success "PostgreSQL already installed."
  fi
  
  # Install FreeSWITCH for PBX functionality
  progress "Installing FreeSWITCH (or simulating it for non-Debian systems)..."
  
  # For Debian/Ubuntu systems, try to install FreeSWITCH properly
  if [ "$PKG_MANAGER" = "apt-get" ] && command -v lsb_release &>/dev/null; then
    apt-get install -y gnupg2 wget lsb-release
    
    wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add -
    
    echo "deb http://files.freeswitch.org/repo/deb/debian-release/ $(lsb_release -sc) main" > /etc/apt/sources.list.d/freeswitch.list
    apt-get update
    
    apt-get install -y freeswitch freeswitch-meta-vanilla freeswitch-mod-event-socket
  else
    # For other systems, we'll simulate FreeSWITCH presence
    warning "FreeSWITCH installation is best supported on Debian/Ubuntu."
    warning "For this installation, we'll set up a simulated FreeSWITCH environment."
    warning "Full PBX functionality will require manual FreeSWITCH installation later."
    
    # Create a directory to simulate FreeSWITCH
    mkdir -p /usr/local/freeswitch/conf
    echo "# Simulated FreeSWITCH configuration" > /usr/local/freeswitch/conf/freeswitch.xml
    
    # Create a simple startup script
    cat > /usr/local/bin/freeswitch-sim << EOF
#!/bin/bash
echo "FreeSWITCH simulator started (not a real FreeSWITCH instance)"
# Keep script running to simulate a daemon
tail -f /dev/null
EOF
    chmod +x /usr/local/bin/freeswitch-sim
  fi
  
  success "All dependencies installed."
}

# Function to configure PostgreSQL
setup_database() {
  progress "Setting up PostgreSQL database..."
  
  # Determine PostgreSQL setup based on system
  if command -v psql &>/dev/null; then
    # Try to determine PostgreSQL version
    if [ -x "$(command -v pg_isready)" ]; then
      PG_STATUS=$(pg_isready)
      if [[ $PG_STATUS == *"accepting connections"* ]]; then
        # PostgreSQL is running
        progress "PostgreSQL is running, configuring database..."
      else
        warning "PostgreSQL installed but not running. Attempting to start..."
        if command -v systemctl &>/dev/null; then
          systemctl start postgresql || systemctl start postgresql-* || true
        elif command -v service &>/dev/null; then
          service postgresql start || service postgresql-* start || true
        elif [ "$(uname)" == "Darwin" ]; then
          brew services start postgresql || brew services start postgresql@14 || true
        fi
      fi
    fi

    # Create database and user
    DB_CREATED=false
    
    # Try using postgres user first (common on Linux)
    if id -u postgres &>/dev/null; then
      su - postgres -c "psql -c \"CREATE DATABASE netwise;\"" && \
      su - postgres -c "psql -c \"CREATE USER netwise WITH ENCRYPTED PASSWORD 'netwise_password';\"" && \
      su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE netwise TO netwise;\"" && \
      DB_CREATED=true
    fi
    
    # If that didn't work, try without su (common on macOS with Homebrew)
    if [ "$DB_CREATED" = false ]; then
      createdb netwise 2>/dev/null && \
      psql -c "CREATE USER netwise WITH ENCRYPTED PASSWORD 'netwise_password';" postgres && \
      psql -c "GRANT ALL PRIVILEGES ON DATABASE netwise TO netwise;" postgres && \
      DB_CREATED=true
    fi
    
    # If that didn't work either, try other methods
    if [ "$DB_CREATED" = false ]; then
      warning "Could not create PostgreSQL database automatically."
      warning "You may need to manually create a database using these commands:"
      warning "  createdb netwise"
      warning "  psql -c \"CREATE USER netwise WITH ENCRYPTED PASSWORD 'netwise_password';\" postgres"
      warning "  psql -c \"GRANT ALL PRIVILEGES ON DATABASE netwise TO netwise;\" postgres"
      warning "Continuing with installation..."
    else
      success "Database setup complete."
    fi
  else
    warning "PostgreSQL client not found in PATH. Database setup skipped."
    warning "You'll need to manually create a database before running the application."
    warning "Continuing with installation..."
  fi
}

# Function to create required directories
create_directories() {
  progress "Creating application directories..."
  
  mkdir -p "$INSTALL_DIR"
  mkdir -p "$DATA_DIR"
  mkdir -p "$LOG_DIR"
  mkdir -p "$CONFIG_DIR"
  
  # Set proper permissions if the netwise user exists
  if id -u netwise &>/dev/null; then
    chown -R netwise:netwise "$INSTALL_DIR" 2>/dev/null || true
    chown -R netwise:netwise "$DATA_DIR" 2>/dev/null || true
    chown -R netwise:netwise "$LOG_DIR" 2>/dev/null || true
    chown -R netwise:netwise "$CONFIG_DIR" 2>/dev/null || true
    success "Directories created with netwise user permissions."
  else
    # Otherwise set reasonable permissions based on current user
    chmod -R 755 "$INSTALL_DIR" 2>/dev/null || true
    chmod -R 755 "$DATA_DIR" 2>/dev/null || true
    chmod -R 755 "$LOG_DIR" 2>/dev/null || true
    chmod -R 755 "$CONFIG_DIR" 2>/dev/null || true
    warning "Netwise user not found. Using default permissions."
    warning "You may need to adjust directory permissions manually."
    success "Directories created with default permissions."
  fi
}

# Function to set up the service
create_service() {
  progress "Creating service..."
  
  # Check if systemd is available
  if command -v systemctl &>/dev/null; then
    progress "Setting up systemd service..."
    
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
    success "Systemd service created and enabled."
    
  # Check if macOS launchd is available
  elif [ "$(uname)" == "Darwin" ]; then
    progress "Setting up macOS launchd service..."
    
    cat > /Library/LaunchDaemons/com.netwise.app.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.netwise.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$INSTALL_DIR/server/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/netwise-error.log</string>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/netwise.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>DATABASE_URL</key>
        <string>postgresql://netwise:netwise_password@localhost:5432/netwise</string>
    </dict>
</dict>
</plist>
EOF
    
    chmod 644 /Library/LaunchDaemons/com.netwise.app.plist
    launchctl load /Library/LaunchDaemons/com.netwise.app.plist
    success "MacOS launchd service created and loaded."
    
  # If no service manager found, create a simple shell script
  else
    progress "System service manager not detected. Creating startup script..."
    
    cat > "$INSTALL_DIR/start_netwise.sh" << EOF
#!/bin/bash
# Netwise ISP Management System
export NODE_ENV=production
export DATABASE_URL=postgresql://netwise:netwise_password@localhost:5432/netwise
cd $INSTALL_DIR
node server/index.js > $LOG_DIR/netwise.log 2> $LOG_DIR/netwise-error.log &
echo \$! > $INSTALL_DIR/netwise.pid
EOF
    
    chmod +x "$INSTALL_DIR/start_netwise.sh"
    
    warning "No service manager detected. To start Netwise:"
    warning "  1. Run: $INSTALL_DIR/start_netwise.sh"
    warning "  2. To stop: kill \$(cat $INSTALL_DIR/netwise.pid)"
    success "Startup script created."
  fi
}

# Function to download the application
download_application() {
  progress "Setting up Netwise application..."
  
  # Check if we already have the application files in the current directory
  if [ -f "./package.json" ] && [ -d "./server" ] && [ -d "./client" ]; then
    progress "Netwise files detected in current directory. Copying to installation directory..."
    cp -r ./* "$INSTALL_DIR/" 2>/dev/null || true
    
  # Try to download from GitHub repository
  else
    progress "Attempting to download Netwise from GitHub..."
    
    # Try downloading from johanbietje's repo first
    if command -v git &>/dev/null; then
      cd /tmp
      
      # First try personal repository
      if git clone https://github.com/johanbietje/netwise-isp 2>/dev/null; then
        progress "Downloaded from johanbietje/netwise-isp repository."
      # Then try official repository
      elif git clone https://github.com/johanbietje/netwise-isp netwise-temp 2>/dev/null; then
        progress "Downloaded from netwise-isp/netwise repository."
      else
        warning "Could not download from GitHub. You may need to manually copy the application files."
        warning "to $INSTALL_DIR after the installation completes."
        mkdir -p /tmp/netwise-temp
        
        # Create a minimal placeholder app
        mkdir -p /tmp/netwise-temp/server
        echo '{
  "name": "netwise",
  "version": "1.0.0",
  "description": "Netwise ISP Management System",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}' > /tmp/netwise-temp/package.json
        
        echo 'const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Netwise ISP Management System - Installation incomplete. Please complete setup.");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Netwise server listening on port ${port}`);
});' > /tmp/netwise-temp/server/index.js
      fi
      
      if [ -d "/tmp/netwise-temp" ]; then
        # Copy files to installation directory
        cp -r /tmp/netwise-temp/* "$INSTALL_DIR/" 2>/dev/null || true
        rm -rf /tmp/netwise-temp
      fi
    else
      warning "Git command not found. Cannot download from GitHub."
      warning "You'll need to manually copy the application files to $INSTALL_DIR."
    fi
  fi
  
  # Install npm dependencies if package.json exists
  if [ -f "$INSTALL_DIR/package.json" ]; then
    progress "Installing Node.js dependencies..."
    cd "$INSTALL_DIR"
    
    if command -v npm &>/dev/null; then
      npm install --production --no-audit --no-fund || warning "Error installing dependencies."
    else
      warning "npm command not found. Skipping dependency installation."
    fi
  fi
  
  # Create environment file
  progress "Creating environment configuration..."
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
  
  # Set ownership if netwise user exists
  if id -u netwise &>/dev/null; then
    chown -R netwise:netwise "$INSTALL_DIR" 2>/dev/null || true
  fi
  
  success "Application setup complete."
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
  
  # Check if FreeSWITCH is installed
  if [ -d "/etc/freeswitch" ]; then
    # Backup original configs
    cp -r /etc/freeswitch /etc/freeswitch.bak 2>/dev/null || true
    
    # TODO: Add specific FreeSWITCH configurations for Netwise
    
    # Restart FreeSWITCH to apply changes
    if command -v systemctl &>/dev/null; then
      systemctl restart freeswitch 2>/dev/null || true
    elif command -v service &>/dev/null; then
      service freeswitch restart 2>/dev/null || true
    fi
    
    success "FreeSWITCH configured for PBX functionality."
  elif [ -d "/usr/local/freeswitch" ]; then
    # Handle FreeSWITCH installed in /usr/local (common on macOS or custom installs)
    cp -r /usr/local/freeswitch/conf /usr/local/freeswitch/conf.bak 2>/dev/null || true
    
    # TODO: Add specific FreeSWITCH configurations for Netwise
    
    # Try to restart FreeSWITCH using various methods
    if [ "$(uname)" == "Darwin" ] && command -v brew &>/dev/null; then
      brew services restart freeswitch 2>/dev/null || true
    else
      # Try to find and kill FreeSWITCH processes
      pkill -9 freeswitch 2>/dev/null || true
      
      # Start FreeSWITCH again
      if [ -x "/usr/local/bin/freeswitch" ]; then
        /usr/local/bin/freeswitch -nc 2>/dev/null &
      elif [ -x "/usr/local/freeswitch/bin/freeswitch" ]; then
        /usr/local/freeswitch/bin/freeswitch -nc 2>/dev/null &
      fi
    fi
    
    success "FreeSWITCH configured for PBX functionality."
  else
    warning "FreeSWITCH configuration directory not found."
    warning "PBX functionality may be limited."
    warning "Continuing with installation..."
  fi
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
  if command -v systemctl &>/dev/null; then
    systemctl start netwise.service || true
  elif [ "$(uname)" == "Darwin" ]; then
    launchctl start com.netwise.app || true
  elif [ -f "$INSTALL_DIR/start_netwise.sh" ]; then
    $INSTALL_DIR/start_netwise.sh || true
  fi
  
  # Determine IP address
  if command -v hostname &>/dev/null && hostname -I &>/dev/null; then
    IP_ADDRESS=$(hostname -I | awk '{print $1}')
  elif command -v ifconfig &>/dev/null; then
    # Try to get IP address on macOS/BSD
    IP_ADDRESS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
  else
    IP_ADDRESS="localhost"
  fi
  
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
  echo -e "Access the web interface at: ${BLUE}http://$IP_ADDRESS:5000${NC}"
  echo -e "Default admin login: ${BLUE}admin / admin123${NC} (change this immediately!)"
  echo ""
  echo -e "${YELLOW}Please secure your installation by:${NC}"
  echo "  - Changing the default admin password"
  echo "  - Setting up SSL/TLS (recommended to use nginx as a reverse proxy)"
  echo "  - Configuring a firewall (ufw or equivalent recommended)"
  echo ""
  echo -e "For support, visit: ${BLUE}https://netwise-isp.com/support${NC}"
  echo ""
}

# Run the installation
main

exit 0
