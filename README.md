# Netwise ISP Management System

Netwise is a comprehensive ISP management system focusing on robust PBX management, RADIUS authentication, and integrated system monitoring.

## Key Features

- Advanced RADIUS authentication implementation
- Multi-tenant PBX system using FreeSWITCH
- Customer billing and package management
- Network monitoring and topology visualization
- Self-service customer portal
- Ticket management system
- Real-time analytics dashboard

## System Requirements

- Debian 10+ or Ubuntu 18.04+
- 4GB RAM minimum (8GB recommended)
- 2 CPU cores minimum (4 recommended)
- 20GB free disk space
- PostgreSQL 12+
- Node.js 18+
- FreeSWITCH for PBX functionality

## Installation

### Automatic Installation

We provide an installation script for Debian-based systems that handles all the setup for you:

1. Download the installation script:
   ```
   wget https://raw.githubusercontent.com/netwise-isp/netwise/main/install_netwise.sh
   ```

2. Make it executable:
   ```
   chmod +x install_netwise.sh
   ```

3. Run the installation script as root:
   ```
   sudo ./install_netwise.sh
   ```

4. Follow the on-screen instructions to complete the installation.

5. Access the web interface at `http://your-server-ip:5000`.

### Manual Installation

For manual installation, please refer to our [detailed installation guide](https://netwise-isp.com/docs/installation).

## Uninstallation

If you need to remove Netwise from your system:

1. Download the uninstallation script:
   ```
   wget https://raw.githubusercontent.com/netwise-isp/netwise/main/uninstall_netwise.sh
   ```

2. Make it executable:
   ```
   chmod +x uninstall_netwise.sh
   ```

3. Run the uninstallation script as root:
   ```
   sudo ./uninstall_netwise.sh
   ```

4. Follow the on-screen prompts to complete the uninstallation.

## Configuration

After installation, the main configuration file is located at `/etc/netwise/env`.

Key configuration options:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Web server port (default: 5000)
- `SESSION_SECRET`: Secret for session encryption
- `FREESWITCH_HOST`: FreeSWITCH server hostname
- `FREESWITCH_PORT`: FreeSWITCH ESL port
- `FREESWITCH_PASSWORD`: FreeSWITCH ESL password

## Default Login

After installation, you can log in with the following default credentials:

- **Username**: admin
- **Password**: admin123

**Important**: Change the default password immediately after the first login.

## Support

For support, please visit our [support portal](https://netwise-isp.com/support) or contact us at support@netwise-isp.com.

## License

Netwise ISP Management System is available under the Business Source License (BSL).
Please see the LICENSE file for more details.

---

© 2023-2025 Netwise Corporation. All rights reserved.