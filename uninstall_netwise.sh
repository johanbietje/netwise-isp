#!/bin/bash

# Netwise ISP Management System - Debian Uninstall Script
# This script will remove Netwise from a Debian-based system
# Run with sudo: sudo bash uninstall_netwise.sh

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
echo -e "${RED}Netwise ISP Management System - Uninstall Script${NC}"
echo -e "${RED}--------------------------------------------${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root: sudo bash uninstall_netwise.sh${NC}"
  exit 1
fi

# Directories to remove
INSTALL_DIR="/opt/netwise"
DATA_DIR="/var/lib/netwise"
LOG_DIR="/var/log/netwise"
CONFIG_DIR="/etc/netwise"

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

# Ask for confirmation
echo -e "${RED}WARNING: This will completely remove Netwise ISP Management System from your system.${NC}"
echo -e "${RED}All configuration and data will be lost.${NC}"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
  echo "Uninstallation cancelled."
  exit 0
fi

# Ask about database
read -p "Would you like to remove the PostgreSQL database as well? (yes/no): " remove_db

# Stop and disable the service
progress "Stopping and disabling Netwise service..."
systemctl stop netwise.service 2>/dev/null || true
systemctl disable netwise.service 2>/dev/null || true
rm -f /etc/systemd/system/netwise.service
systemctl daemon-reload
success "Service stopped and disabled."

# Remove application files
progress "Removing application files..."
rm -rf "$INSTALL_DIR"
rm -rf "$DATA_DIR"
rm -rf "$LOG_DIR"
rm -rf "$CONFIG_DIR"
success "Application files removed."

# Remove database if requested
if [ "$remove_db" = "yes" ]; then
  progress "Removing PostgreSQL database..."
  su - postgres -c "psql -c \"DROP DATABASE IF EXISTS netwise;\""
  su - postgres -c "psql -c \"DROP USER IF EXISTS netwise;\""
  success "Database removed."
else
  warning "PostgreSQL database and user 'netwise' were not removed."
fi

# Ask about removing the service user
read -p "Would you like to remove the 'netwise' system user? (yes/no): " remove_user

if [ "$remove_user" = "yes" ]; then
  progress "Removing netwise system user..."
  userdel netwise 2>/dev/null || true
  success "System user removed."
else
  warning "System user 'netwise' was not removed."
fi

# Ask about removing FreeSWITCH
read -p "Would you like to remove FreeSWITCH? (yes/no): " remove_freeswitch

if [ "$remove_freeswitch" = "yes" ]; then
  progress "Removing FreeSWITCH..."
  apt-get purge -y freeswitch* || true
  apt-get autoremove -y
  success "FreeSWITCH removed."
else
  warning "FreeSWITCH was not removed."
fi

# Final report
echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}Netwise ISP Management System Uninstallation Complete${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
if [ "$remove_db" != "yes" ]; then
  echo -e "${YELLOW}Note: The PostgreSQL database was preserved.${NC}"
fi
if [ "$remove_user" != "yes" ]; then
  echo -e "${YELLOW}Note: The system user 'netwise' was preserved.${NC}"
fi
if [ "$remove_freeswitch" != "yes" ]; then
  echo -e "${YELLOW}Note: FreeSWITCH was preserved.${NC}"
fi
echo ""
echo "Thank you for using Netwise ISP Management System!"
echo ""

exit 0