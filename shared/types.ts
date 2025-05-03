export interface RadiusRequest {
  username: string;
  password: string;
  clientIpAddress: string;
  nasIdentifier?: string;
  callingStationId?: string;
}

export interface RadiusResponse {
  status: 'accept' | 'reject';
  message?: string;
  attributes?: Record<string, string | number>;
}

export interface BandwidthUsage {
  date: string;
  download: number;
  upload: number;
}

export interface DashboardStats {
  totalCustomers: number;
  customersGrowth: number;
  activeSessions: number;
  sessionsGrowth: number;
  openTickets: number;
  ticketsGrowth: number;
  bandwidthUsage: number;
  bandwidthGrowth: number;
}

export interface TimeRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface TopCustomer {
  id: number;
  fullName: string;
  email: string;
  plan: string;
  speed: string;
  usage: number;
  percentage: number;
  status: string;
}

export interface RecentActivity {
  id: number;
  type: 'customer' | 'ticket' | 'resolved' | 'alert';
  message: string;
  timestamp: Date;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum CustomerStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated'
}

export enum BillingStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

export interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

export interface Customer {
  id: number;
  username: string;
  password?: string;
  email: string | null;
  fullName: string;
  address: string | null;
  phone: string | null;
  status: string; // Should match CustomerStatus enum values
  planId: number | null;
  plan?: {
    id: number;
    name: string;
    price: number;
    downloadSpeed: number;
    uploadSpeed: number;
    dataLimit: number | null;
  };
  createdAt: string | Date;
}
