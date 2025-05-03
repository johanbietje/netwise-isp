import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  BarChart2, 
  FileText, 
  MessageSquare, 
  Server, 
  Settings, 
  Shield, 
  Menu, 
  X,
  Package,
  Phone,
  LineChart,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MenuItem } from '@shared/types';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Create menu items
  const managementMenuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: <Home className="h-5 w-5 mr-3" />,
      href: '/dashboard',
      active: location === '/dashboard',
    },
    {
      label: 'Customers',
      icon: <Users className="h-5 w-5 mr-3" />,
      href: '/customers',
      active: location.startsWith('/customers'),
    },
    {
      label: 'Internet Packages',
      icon: <Package className="h-5 w-5 mr-3" />,
      href: '/packages',
      active: location === '/packages',
    },
    {
      label: 'Bandwidth',
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      href: '/bandwidth',
      active: location === '/bandwidth',
    },
    {
      label: 'Billing',
      icon: <FileText className="h-5 w-5 mr-3" />,
      href: '/billing',
      active: location === '/billing',
    },
    {
      label: 'Tickets',
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      href: '/tickets',
      active: location.startsWith('/tickets'),
    },
  ];

  const systemMenuItems: MenuItem[] = [
    {
      label: 'RADIUS Server',
      icon: <Server className="h-5 w-5 mr-3" />,
      href: '/radius',
      active: location === '/radius',
    },
    {
      label: 'Network Monitoring',
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      href: '/network',
      active: location === '/network',
    },
    {
      label: 'PBX System',
      icon: <Phone className="h-5 w-5 mr-3" />,
      href: '/pbx',
      active: location.startsWith('/pbx'),
    },
    {
      label: 'Advanced Analytics',
      icon: <LineChart className="h-5 w-5 mr-3" />,
      href: '/analytics',
      active: location === '/analytics',
    },
    {
      label: 'System Activity',
      icon: <Activity className="h-5 w-5 mr-3" />,
      href: '/activity',
      active: location === '/activity',
    },
    {
      label: 'Settings',
      icon: <Settings className="h-5 w-5 mr-3" />,
      href: '/settings',
      active: location === '/settings',
    },
  ];
  
  // Only show User Roles to admins
  if (user?.role === 'admin') {
    systemMenuItems.push({
      label: 'User Roles',
      icon: <Shield className="h-5 w-5 mr-3" />,
      href: '/roles',
      active: location === '/roles',
    });
  }

  const sidebarClasses = cn(
    'bg-gradient-to-b from-purple-900 to-purple-800 text-white flex-shrink-0 flex flex-col shadow-lg',
    isMobile ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out' : 'w-64',
    isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'
  );

  return (
    <aside className={sidebarClasses}>
      <div className="p-4 border-b border-purple-700/50 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">Netwise</h1>
        {isMobile && (
          <button onClick={onClose} className="text-purple-200 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <div className="pb-3">
          <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2 px-3">
            Management
          </p>
          {managementMenuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center px-3 py-2 rounded-md mt-1 transition-colors duration-200",
                item.active ? 
                  "bg-purple-700/50 text-white font-medium" : 
                  "text-purple-100 hover:bg-purple-700/30 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
        <div className="pb-3">
          <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2 px-3">
            System
          </p>
          {systemMenuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center px-3 py-2 rounded-md mt-1 transition-colors duration-200",
                item.active ? 
                  "bg-purple-700/50 text-white font-medium" : 
                  "text-purple-100 hover:bg-purple-700/30 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
