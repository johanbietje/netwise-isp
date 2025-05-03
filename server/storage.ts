import {
  users, User, InsertUser,
  customers, Customer, InsertCustomer,
  plans, Plan, InsertPlan,
  subscriptions, Subscription, InsertSubscription,
  usages, Usage, InsertUsage,
  billings, Billing, InsertBilling,
  tickets, Ticket, InsertTicket,
  ticketComments, TicketComment, InsertTicketComment,
  radiusClients, RadiusClient, InsertRadiusClient,
  radiusAuth, RadiusAuth, InsertRadiusAuth,
  activityLogs, ActivityLog, InsertActivityLog,
  networkDevices, NetworkDevice, InsertNetworkDevice,
  networkConnections, NetworkConnection, InsertNetworkConnection,
  networkMetrics, NetworkMetric, InsertNetworkMetric,
  ipNetworks, IpNetwork, InsertIpNetwork,
  ipAddresses, IpAddress, InsertIpAddress
} from "@shared/schema";
import {
  NetworkOptimization, InsertNetworkOptimization,
  SecurityAudit, InsertSecurityAudit,
  SecurityThreat, InsertSecurityThreat,
  CustomerPortalSetting, InsertCustomerPortalSetting,
  UsageAlert, InsertUsageAlert,
  RevenueForecast, InsertRevenueForecast,
  DynamicPricingRule, InsertDynamicPricingRule,
  FieldTechnician, InsertFieldTechnician,
  FieldServiceJob, InsertFieldServiceJob,
  NetworkVisualization, InsertNetworkVisualization,
  CustomDashboard, InsertCustomDashboard,
  ServiceIntegration, InsertServiceIntegration,
  ServiceBundle, InsertServiceBundle
} from "../shared/features";
import {
  networkOptimizations, securityAudits, securityThreats, customerPortalSettings,
  usageAlerts, revenueForecast, dynamicPricingRules, fieldTechnicians,
  fieldServiceJobs, networkVisualizations, customDashboards, serviceIntegrations,
  serviceBundles
} from "../shared/features";
import { db } from "./db";
import { BandwidthUsage, DashboardStats, TopCustomer, RecentActivity } from "@shared/types";
import { asc, desc, eq, and, or, gte, lte, count, sum, SQL, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Customers
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  listCustomers(): Promise<Customer[]>;
  searchCustomers(term: string): Promise<Customer[]>;
  
  // Plans
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: number, plan: Partial<Plan>): Promise<Plan | undefined>;
  deletePlan(id: number): Promise<boolean>;
  listPlans(): Promise<Plan[]>;
  
  // Subscriptions
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByCustomerId(customerId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;
  listSubscriptions(): Promise<Subscription[]>;
  
  // Usage
  createUsage(usage: InsertUsage): Promise<Usage>;
  getCustomerUsage(customerId: number): Promise<Usage[]>;
  getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]>;
  getTotalUsage(startDate: Date, endDate: Date): Promise<Usage[]>;
  getTopCustomersByUsage(limit: number, startDate: Date, endDate: Date): Promise<TopCustomer[]>;
  getBandwidthUsageOverTime(days: number): Promise<BandwidthUsage[]>;
  
  // Billing
  getBilling(id: number): Promise<Billing | undefined>;
  createBilling(billing: InsertBilling): Promise<Billing>;
  updateBilling(id: number, billing: Partial<Billing>): Promise<Billing | undefined>;
  listBillingsByCustomerId(customerId: number): Promise<Billing[]>;
  listPendingBillings(): Promise<Billing[]>;
  
  // Tickets
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<Ticket>): Promise<Ticket | undefined>;
  listTickets(): Promise<Ticket[]>;
  listTicketsByCustomerId(customerId: number): Promise<Ticket[]>;
  listOpenTickets(): Promise<Ticket[]>;
  
  // Ticket Comments
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;
  listTicketCommentsByTicketId(ticketId: number): Promise<TicketComment[]>;
  
  // RADIUS Clients
  getRadiusClient(id: number): Promise<RadiusClient | undefined>;
  getRadiusClientByIp(ipAddress: string): Promise<RadiusClient | undefined>;
  createRadiusClient(client: InsertRadiusClient): Promise<RadiusClient>;
  updateRadiusClient(id: number, client: Partial<RadiusClient>): Promise<RadiusClient | undefined>;
  deleteRadiusClient(id: number): Promise<boolean>;
  listRadiusClients(): Promise<RadiusClient[]>;
  
  // RADIUS Auth
  createRadiusAuth(auth: InsertRadiusAuth): Promise<RadiusAuth>;
  listRadiusAuth(limit: number): Promise<RadiusAuth[]>;
  getRadiusAuthsByUsername(username: string, limit: number): Promise<RadiusAuth[]>;
  getRadiusAuthsByTimeRange(startDate: Date, endDate: Date): Promise<RadiusAuth[]>;
  getCustomerCount(): Promise<number>;
  getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]>;
  
  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  listRecentActivityLogs(limit: number): Promise<RecentActivity[]>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Network Devices
  getNetworkDevice(id: number): Promise<NetworkDevice | undefined>;
  createNetworkDevice(device: InsertNetworkDevice): Promise<NetworkDevice>;
  updateNetworkDevice(id: number, device: Partial<NetworkDevice>): Promise<NetworkDevice | undefined>;
  deleteNetworkDevice(id: number): Promise<boolean>;
  listNetworkDevices(): Promise<NetworkDevice[]>;
  updateNetworkDeviceCoordinates(id: number, coordinates: { x: number, y: number }): Promise<NetworkDevice | undefined>;
  
  // IP Address Management (IPAM)
  getIpNetwork(id: number): Promise<IpNetwork | undefined>;
  createIpNetwork(network: InsertIpNetwork): Promise<IpNetwork>;
  updateIpNetwork(id: number, network: Partial<IpNetwork>): Promise<IpNetwork | undefined>;
  deleteIpNetwork(id: number): Promise<boolean>;
  listIpNetworks(): Promise<IpNetwork[]>;
  
  getIpAddress(id: number): Promise<IpAddress | undefined>;
  createIpAddress(address: InsertIpAddress): Promise<IpAddress>;
  updateIpAddress(id: number, address: Partial<IpAddress>): Promise<IpAddress | undefined>;
  deleteIpAddress(id: number): Promise<boolean>;
  listIpAddresses(): Promise<IpAddress[]>;
  getIpAddressesByNetworkId(networkId: number): Promise<IpAddress[]>;
  
  // Network Connections
  getNetworkConnection(id: number): Promise<NetworkConnection | undefined>;
  createNetworkConnection(connection: InsertNetworkConnection): Promise<NetworkConnection>;
  updateNetworkConnection(id: number, connection: Partial<NetworkConnection>): Promise<NetworkConnection | undefined>;
  deleteNetworkConnection(id: number): Promise<boolean>;
  listNetworkConnections(): Promise<NetworkConnection[]>;
  
  // Network Metrics
  createNetworkMetric(metric: InsertNetworkMetric): Promise<NetworkMetric>;
  listNetworkMetrics(limit: number): Promise<NetworkMetric[]>;
  getNetworkMetricsByDeviceId(deviceId: number, limit: number): Promise<NetworkMetric[]>;

  // 1. AI-Powered Network Optimization
  getNetworkOptimization(id: number): Promise<NetworkOptimization | undefined>;
  createNetworkOptimization(optimization: InsertNetworkOptimization): Promise<NetworkOptimization>;
  updateNetworkOptimization(id: number, optimization: Partial<NetworkOptimization>): Promise<NetworkOptimization | undefined>;
  deleteNetworkOptimization(id: number): Promise<boolean>;
  listNetworkOptimizations(): Promise<NetworkOptimization[]>;
  
  // 2. Enhanced Security Suite
  getSecurityAudit(id: number): Promise<SecurityAudit | undefined>;
  createSecurityAudit(audit: InsertSecurityAudit): Promise<SecurityAudit>;
  updateSecurityAudit(id: number, audit: Partial<SecurityAudit>): Promise<SecurityAudit | undefined>;
  listSecurityAudits(): Promise<SecurityAudit[]>;
  
  getSecurityThreat(id: number): Promise<SecurityThreat | undefined>;
  createSecurityThreat(threat: InsertSecurityThreat): Promise<SecurityThreat>;
  updateSecurityThreat(id: number, threat: Partial<SecurityThreat>): Promise<SecurityThreat | undefined>;
  resolveSecurityThreat(id: number): Promise<SecurityThreat | undefined>;
  listSecurityThreats(): Promise<SecurityThreat[]>;
  listActiveSecurityThreats(): Promise<SecurityThreat[]>;
  
  // 3. Customer Self-Service Portal
  getCustomerPortalSettings(customerId: number): Promise<CustomerPortalSetting | undefined>;
  createCustomerPortalSettings(settings: InsertCustomerPortalSetting): Promise<CustomerPortalSetting>;
  updateCustomerPortalSettings(customerId: number, settings: Partial<CustomerPortalSetting>): Promise<CustomerPortalSetting | undefined>;
  
  getUsageAlert(id: number): Promise<UsageAlert | undefined>;
  createUsageAlert(alert: InsertUsageAlert): Promise<UsageAlert>;
  updateUsageAlert(id: number, alert: Partial<UsageAlert>): Promise<UsageAlert | undefined>;
  deleteUsageAlert(id: number): Promise<boolean>;
  listUsageAlertsByCustomerId(customerId: number): Promise<UsageAlert[]>;
  
  // 4. Advanced Revenue Management
  getRevenueForecast(id: number): Promise<RevenueForecast | undefined>;
  createRevenueForecast(forecast: InsertRevenueForecast): Promise<RevenueForecast>;
  updateRevenueForecast(id: number, forecast: Partial<RevenueForecast>): Promise<RevenueForecast | undefined>;
  listRevenueForecastsByYear(year: number): Promise<RevenueForecast[]>;
  
  getDynamicPricingRule(id: number): Promise<DynamicPricingRule | undefined>;
  createDynamicPricingRule(rule: InsertDynamicPricingRule): Promise<DynamicPricingRule>;
  updateDynamicPricingRule(id: number, rule: Partial<DynamicPricingRule>): Promise<DynamicPricingRule | undefined>;
  deleteDynamicPricingRule(id: number): Promise<boolean>;
  listDynamicPricingRules(): Promise<DynamicPricingRule[]>;
  listActiveDynamicPricingRules(): Promise<DynamicPricingRule[]>;
  
  // 5. Field Service Management
  getFieldTechnician(id: number): Promise<FieldTechnician | undefined>;
  createFieldTechnician(technician: InsertFieldTechnician): Promise<FieldTechnician>;
  updateFieldTechnician(id: number, technician: Partial<FieldTechnician>): Promise<FieldTechnician | undefined>;
  listFieldTechnicians(): Promise<FieldTechnician[]>;
  listAvailableFieldTechnicians(): Promise<FieldTechnician[]>;
  
  getFieldServiceJob(id: number): Promise<FieldServiceJob | undefined>;
  createFieldServiceJob(job: InsertFieldServiceJob): Promise<FieldServiceJob>;
  updateFieldServiceJob(id: number, job: Partial<FieldServiceJob>): Promise<FieldServiceJob | undefined>;
  assignTechnicianToJob(jobId: number, technicianId: number): Promise<FieldServiceJob | undefined>;
  completeFieldServiceJob(id: number): Promise<FieldServiceJob | undefined>;
  listFieldServiceJobs(): Promise<FieldServiceJob[]>;
  listFieldServiceJobsByStatus(status: string): Promise<FieldServiceJob[]>;
  listFieldServiceJobsByCustomerId(customerId: number): Promise<FieldServiceJob[]>;
  
  // 6. Network Performance Visualization
  getNetworkVisualization(id: number): Promise<NetworkVisualization | undefined>;
  createNetworkVisualization(visualization: InsertNetworkVisualization): Promise<NetworkVisualization>;
  updateNetworkVisualization(id: number, visualization: Partial<NetworkVisualization>): Promise<NetworkVisualization | undefined>;
  deleteNetworkVisualization(id: number): Promise<boolean>;
  listNetworkVisualizations(): Promise<NetworkVisualization[]>;
  
  getCustomDashboard(id: number): Promise<CustomDashboard | undefined>;
  createCustomDashboard(dashboard: InsertCustomDashboard): Promise<CustomDashboard>;
  updateCustomDashboard(id: number, dashboard: Partial<CustomDashboard>): Promise<CustomDashboard | undefined>;
  deleteCustomDashboard(id: number): Promise<boolean>;
  listCustomDashboards(): Promise<CustomDashboard[]>;
  listCustomDashboardsByOwnerId(ownerId: number): Promise<CustomDashboard[]>;
  
  // 7. Multi-Service Integration
  getServiceIntegration(id: number): Promise<ServiceIntegration | undefined>;
  createServiceIntegration(integration: InsertServiceIntegration): Promise<ServiceIntegration>;
  updateServiceIntegration(id: number, integration: Partial<ServiceIntegration>): Promise<ServiceIntegration | undefined>;
  deleteServiceIntegration(id: number): Promise<boolean>;
  listServiceIntegrations(): Promise<ServiceIntegration[]>;
  
  getServiceBundle(id: number): Promise<ServiceBundle | undefined>;
  createServiceBundle(bundle: InsertServiceBundle): Promise<ServiceBundle>;
  updateServiceBundle(id: number, bundle: Partial<ServiceBundle>): Promise<ServiceBundle | undefined>;
  deleteServiceBundle(id: number): Promise<boolean>;
  listServiceBundles(): Promise<ServiceBundle[]>;
  listActiveServiceBundles(): Promise<ServiceBundle[]>;
}

export class MemStorage implements IStorage {
  // Original storage maps
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private plans: Map<number, Plan>;
  private subscriptions: Map<number, Subscription>;
  private usages: Map<number, Usage>;
  private billings: Map<number, Billing>;
  private tickets: Map<number, Ticket>;
  private ticketComments: Map<number, TicketComment>;
  private radiusClients: Map<number, RadiusClient>;
  private radiusAuth: Map<number, RadiusAuth>;
  private activityLogs: Map<number, ActivityLog>;
  private networkDevices: Map<number, NetworkDevice>;
  private networkConnections: Map<number, NetworkConnection>;
  private networkMetrics: Map<number, NetworkMetric>;
  private ipNetworks: Map<number, IpNetwork>;
  private ipAddresses: Map<number, IpAddress>;
  
  // New feature storage maps
  private networkOptimizations: Map<number, NetworkOptimization>;
  private securityAudits: Map<number, SecurityAudit>;
  private securityThreats: Map<number, SecurityThreat>;
  private customerPortalSettings: Map<number, CustomerPortalSetting>;
  private usageAlerts: Map<number, UsageAlert>;
  private revenueForecast: Map<number, RevenueForecast>;
  private dynamicPricingRules: Map<number, DynamicPricingRule>;
  private fieldTechnicians: Map<number, FieldTechnician>;
  private fieldServiceJobs: Map<number, FieldServiceJob>;
  private networkVisualizations: Map<number, NetworkVisualization>;
  private customDashboards: Map<number, CustomDashboard>;
  private serviceIntegrations: Map<number, ServiceIntegration>;
  private serviceBundles: Map<number, ServiceBundle>;
  
  // Original IDs
  private currentUserId: number;
  private currentCustomerId: number;
  private currentPlanId: number;
  private currentSubscriptionId: number;
  private currentUsageId: number;
  private currentBillingId: number;
  private currentTicketId: number;
  private currentTicketCommentId: number;
  private currentRadiusClientId: number;
  private currentRadiusAuthId: number;
  private currentActivityLogId: number;
  private currentNetworkDeviceId: number;
  private currentNetworkConnectionId: number;
  private currentNetworkMetricId: number;
  private currentIpNetworkId: number;
  private currentIpAddressId: number;
  
  // New feature IDs
  private currentNetworkOptimizationId: number;
  private currentSecurityAuditId: number;
  private currentSecurityThreatId: number;
  private currentUsageAlertId: number;
  private currentRevenueForecastId: number;
  private currentDynamicPricingRuleId: number;
  private currentFieldTechnicianId: number;
  private currentFieldServiceJobId: number;
  private currentNetworkVisualizationId: number;
  private currentCustomDashboardId: number;
  private currentServiceIntegrationId: number;
  private currentServiceBundleId: number;
  
  constructor() {
    // Initialize original storage maps
    this.users = new Map();
    this.customers = new Map();
    this.plans = new Map();
    this.subscriptions = new Map();
    this.usages = new Map();
    this.billings = new Map();
    this.tickets = new Map();
    this.ticketComments = new Map();
    this.radiusClients = new Map();
    this.radiusAuth = new Map();
    this.activityLogs = new Map();
    this.networkDevices = new Map();
    this.networkConnections = new Map();
    this.networkMetrics = new Map();
    this.ipNetworks = new Map();
    this.ipAddresses = new Map();
    
    // Initialize new feature storage maps
    this.networkOptimizations = new Map();
    this.securityAudits = new Map();
    this.securityThreats = new Map();
    this.customerPortalSettings = new Map();
    this.usageAlerts = new Map();
    this.revenueForecast = new Map();
    this.dynamicPricingRules = new Map();
    this.fieldTechnicians = new Map();
    this.fieldServiceJobs = new Map();
    this.networkVisualizations = new Map();
    this.customDashboards = new Map();
    this.serviceIntegrations = new Map();
    this.serviceBundles = new Map();
    
    // Initialize original IDs
    this.currentUserId = 1;
    this.currentCustomerId = 1;
    this.currentPlanId = 1;
    this.currentSubscriptionId = 1;
    this.currentUsageId = 1;
    this.currentBillingId = 1;
    this.currentTicketId = 1;
    this.currentTicketCommentId = 1;
    this.currentRadiusClientId = 1;
    this.currentRadiusAuthId = 1;
    this.currentActivityLogId = 1;
    this.currentNetworkDeviceId = 1;
    this.currentNetworkConnectionId = 1;
    this.currentNetworkMetricId = 1;
    this.currentIpNetworkId = 1;
    this.currentIpAddressId = 1;
    
    // Initialize new feature IDs
    this.currentNetworkOptimizationId = 1;
    this.currentSecurityAuditId = 1;
    this.currentSecurityThreatId = 1;
    this.currentUsageAlertId = 1;
    this.currentRevenueForecastId = 1;
    this.currentDynamicPricingRuleId = 1;
    this.currentFieldTechnicianId = 1;
    this.currentFieldServiceJobId = 1;
    this.currentNetworkVisualizationId = 1;
    this.currentCustomDashboardId = 1;
    this.currentServiceIntegrationId = 1;
    this.currentServiceBundleId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Create admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      email: 'admin@radiusisp.com',
      fullName: 'Admin User',
      role: 'admin'
    });
    
    // Create some plans
    const basicPlan = this.createPlan({
      name: 'Basic',
      downloadSpeed: 25,
      uploadSpeed: 10,
      dataLimit: 500,
      price: 39.99
    });
    
    const premiumPlan = this.createPlan({
      name: 'Premium',
      downloadSpeed: 75,
      uploadSpeed: 25,
      dataLimit: 1000,
      price: 59.99
    });
    
    const businessPlan = this.createPlan({
      name: 'Business Pro',
      downloadSpeed: 100,
      uploadSpeed: 50,
      dataLimit: null,
      price: 99.99
    });
    
    const smallBusinessPlan = this.createPlan({
      name: 'Small Business',
      downloadSpeed: 50,
      uploadSpeed: 25,
      dataLimit: 750,
      price: 79.99
    });
    
    // Create some customers
    const johnDoe = this.createCustomer({
      username: 'johndoe',
      password: 'password123',
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      address: '123 Main St, Anytown, AT 12345',
      phone: '555-123-4567',
      status: 'active'
    });
    
    const janeSmith = this.createCustomer({
      username: 'janesmith',
      password: 'password456',
      email: 'jane.smith@example.com',
      fullName: 'Jane Smith',
      address: '456 Oak Ave, Sometown, ST 67890',
      phone: '555-987-6543',
      status: 'active'
    });
    
    const robertJohnson = this.createCustomer({
      username: 'rjohnson',
      password: 'password789',
      email: 'robert.j@example.com',
      fullName: 'Robert Johnson',
      address: '789 Pine Blvd, Othertown, OT 45678',
      phone: '555-456-7890',
      status: 'active'
    });
    
    const mariaLopez = this.createCustomer({
      username: 'mlopez',
      password: 'passwordabc',
      email: 'maria.l@example.com',
      fullName: 'Maria Lopez',
      address: '321 Elm St, Newtown, NT 98765',
      phone: '555-321-0987',
      status: 'active'
    });
    
    // Create subscriptions
    this.createSubscription({
      customerId: johnDoe.id,
      planId: businessPlan.id,
      startDate: new Date('2023-01-01'),
      status: 'active'
    });
    
    this.createSubscription({
      customerId: janeSmith.id,
      planId: premiumPlan.id,
      startDate: new Date('2023-02-15'),
      status: 'active'
    });
    
    this.createSubscription({
      customerId: robertJohnson.id,
      planId: smallBusinessPlan.id,
      startDate: new Date('2023-03-10'),
      status: 'active'
    });
    
    this.createSubscription({
      customerId: mariaLopez.id,
      planId: basicPlan.id,
      startDate: new Date('2023-04-05'),
      status: 'active'
    });
    
    // Create usage records
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    this.createUsage({
      customerId: johnDoe.id,
      downloadUsage: 3500, // 3.5 TB
      uploadUsage: 700,    // 0.7 TB
      date: today
    });
    
    this.createUsage({
      customerId: janeSmith.id,
      downloadUsage: 3000, // 3.0 TB
      uploadUsage: 700,    // 0.7 TB
      date: today
    });
    
    this.createUsage({
      customerId: robertJohnson.id,
      downloadUsage: 2300, // 2.3 TB
      uploadUsage: 500,    // 0.5 TB
      date: today
    });
    
    this.createUsage({
      customerId: mariaLopez.id,
      downloadUsage: 2100, // 2.1 TB
      uploadUsage: 400,    // 0.4 TB
      date: today
    });
    
    // Create billing records
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    this.createBilling({
      customerId: johnDoe.id,
      amount: 99.99,
      description: 'Monthly subscription - Business Pro',
      status: 'pending',
      dueDate: nextMonth
    });
    
    this.createBilling({
      customerId: janeSmith.id,
      amount: 59.99,
      description: 'Monthly subscription - Premium',
      status: 'pending',
      dueDate: nextMonth
    });
    
    // Create tickets
    this.createTicket({
      customerId: janeSmith.id,
      subject: 'Connection issues',
      description: 'Having intermittent connection drops in the evening',
      status: 'open',
      priority: 'medium'
    });
    
    this.createTicket({
      customerId: robertJohnson.id,
      subject: 'Speed not as advertised',
      description: 'Not getting the promised 50 Mbps during peak hours',
      status: 'open',
      priority: 'high'
    });
    
    // Create RADIUS clients
    this.createRadiusClient({
      name: 'Main Access Server',
      ipAddress: '192.168.1.10',
      secret: 'radiussecret123',
      description: 'Primary access server',
      active: true
    });
    
    this.createRadiusClient({
      name: 'Backup Access Server',
      ipAddress: '192.168.1.11',
      secret: 'radiussecret456',
      description: 'Secondary access server',
      active: true
    });
    
    // Create activity logs
    this.createActivityLog({
      userId: 1,
      action: 'User Login',
      details: 'Admin logged in',
      ipAddress: '127.0.0.1'
    });
    
    this.createActivityLog({
      customerId: johnDoe.id,
      action: 'Customer Registered',
      details: 'New customer registered',
      ipAddress: '192.168.1.100'
    });

    // Create IP Networks (IPAM)
    const managementNetwork = this.createIpNetwork({
      networkAddress: '10.0.0.0',
      subnetMask: '255.255.255.0',
      vlanId: 10,
      description: 'Management Network',
      location: 'Main Datacenter',
      category: 'management',
      assignedTo: 'IT Department'
    });

    const infrastructureNetwork = this.createIpNetwork({
      networkAddress: '10.0.1.0',
      subnetMask: '255.255.255.0',
      vlanId: 20,
      description: 'Infrastructure Network',
      location: 'Main Datacenter',
      category: 'infrastructure',
      assignedTo: 'Network Operations'
    });

    const customerNetwork1 = this.createIpNetwork({
      networkAddress: '192.168.100.0',
      subnetMask: '255.255.255.0',
      vlanId: 100,
      description: 'Customer Network - Residential',
      location: 'North Region',
      category: 'customer',
      assignedTo: 'Residential Clients'
    });

    const customerNetwork2 = this.createIpNetwork({
      networkAddress: '192.168.200.0',
      subnetMask: '255.255.255.0',
      vlanId: 200,
      description: 'Customer Network - Business',
      location: 'South Region',
      category: 'customer',
      assignedTo: 'Business Clients'
    });

    // Create IP Addresses
    this.createIpAddress({
      networkId: managementNetwork.id,
      ipAddress: '10.0.0.1',
      hostname: 'gateway.mgmt.local',
      macAddress: '00:11:22:33:44:55',
      status: 'assigned',
      assignedTo: 'Core Router',
      description: 'Management Network Gateway'
    });

    this.createIpAddress({
      networkId: managementNetwork.id,
      ipAddress: '10.0.0.2',
      hostname: 'switch1.mgmt.local',
      macAddress: '00:11:22:33:44:56',
      status: 'assigned',
      assignedTo: 'Core Switch',
      description: 'Main Distribution Switch'
    });

    this.createIpAddress({
      networkId: infrastructureNetwork.id,
      ipAddress: '10.0.1.1',
      hostname: 'gateway.infra.local',
      macAddress: '00:11:22:33:44:60',
      status: 'assigned',
      assignedTo: 'Infrastructure Router',
      description: 'Infrastructure Network Gateway'
    });

    this.createIpAddress({
      networkId: customerNetwork1.id,
      ipAddress: '192.168.100.1',
      hostname: 'gateway.residential.local',
      macAddress: '00:11:22:33:44:70',
      status: 'assigned',
      assignedTo: 'Residential Gateway',
      description: 'Residential Network Gateway'
    });

    this.createIpAddress({
      networkId: customerNetwork2.id,
      ipAddress: '192.168.200.1',
      hostname: 'gateway.business.local',
      macAddress: '00:11:22:33:44:80',
      status: 'assigned',
      assignedTo: 'Business Gateway',
      description: 'Business Network Gateway'
    });

    // Create some available IPs
    for (let i = 10; i <= 20; i++) {
      this.createIpAddress({
        networkId: customerNetwork1.id,
        ipAddress: `192.168.100.${i}`,
        status: 'available',
        description: 'Available for assignment'
      });
    }

    for (let i = 10; i <= 20; i++) {
      this.createIpAddress({
        networkId: customerNetwork2.id,
        ipAddress: `192.168.200.${i}`,
        status: 'available',
        description: 'Available for assignment'
      });
    }

    // Initialize AI-Powered Network Optimization data
    this.createNetworkOptimization({
      name: "Bandwidth Optimization",
      description: "AI-driven bandwidth allocation based on usage patterns",
      optimizationType: "bandwidth",
      status: "active",
      settings: {
        threshold: 80,
        learningRate: 0.01,
        priorityApplications: ["voip", "video"]
      },
      scheduledFor: new Date(new Date().setDate(new Date().getDate() + 1)),
    });

    this.createNetworkOptimization({
      name: "QoS Pattern Recognition",
      description: "Identifies traffic patterns and optimizes QoS settings",
      optimizationType: "qos",
      status: "scheduled",
      settings: {
        analysisPeriod: "7d",
        minConfidence: 0.85,
        applicationClasses: ["realtime", "bulk", "interactive"]
      },
      scheduledFor: new Date(new Date().setDate(new Date().getDate() + 3)),
    });

    // Initialize Enhanced Security Suite data
    this.createSecurityAudit({
      name: "Quarterly Network Security Audit",
      status: "in-progress",
      severity: "medium",
      networkId: 1,
      findings: [],
      recommendations: []
    });

    this.createSecurityThreat({
      name: "Suspicious Login Attempts",
      description: "Multiple failed login attempts detected from unusual locations",
      severity: "high",
      sourceIp: "45.123.45.67",
      threatType: "brute_force",
      status: "active",
      mitigationSteps: {
        recommended: [
          "Enable 2FA for all admin accounts",
          "Implement IP-based access restrictions",
          "Review login policies"
        ]
      }
    });

    // Initialize Customer Self-Service Portal data
    this.createCustomerPortalSettings({
      customerId: 1,
      dashboardLayout: {
        widgets: ["usage", "billing", "support", "network-status"],
        layout: "grid"
      },
      notificationPreferences: {
        email: true,
        sms: false,
        pushNotifications: true
      },
      uiPreferences: {
        theme: "light",
        language: "en",
        fontSize: "medium"
      },
      accessControls: {
        allowBillingManagement: true,
        allowPackageChanges: true,
        allowProfileEditing: true
      }
    });

    this.createUsageAlert({
      customerId: 1,
      name: "80% Data Usage Alert",
      threshold: 80,
      alertType: "email",
      isActive: true
    });

    // Initialize Advanced Revenue Management data
    const currentYear = new Date().getFullYear();
    for (let i = 1; i <= 12; i++) {
      this.createRevenueForecast({
        month: new Date(currentYear, i - 1, 1),
        year: currentYear,
        predictedRevenue: 50000 + Math.floor(Math.random() * 10000),
        confidenceLevel: 85 + Math.floor(Math.random() * 10),
        forecastFactors: {
          seasonalTrends: true,
          newCustomerGrowth: Math.random() * 0.05,
          churnRate: Math.random() * 0.02,
          marketingCampaigns: [
            { name: "Summer Special", impact: 0.08 }
          ]
        }
      });
    }

    this.createDynamicPricingRule({
      name: "Peak Usage Surcharge",
      description: "Applies a surcharge during peak usage hours",
      isActive: true,
      conditions: {
        timeOfDay: { start: "18:00", end: "22:00" },
        daysOfWeek: [1, 2, 3, 4, 5],
        networkLoad: { min: 75 }
      },
      adjustmentType: "percentage",
      adjustmentValue: 10
    });

    // Initialize Field Service Management data
    this.createFieldTechnician({
      userId: 1,
      specializations: ["fiber", "wireless", "installation"],
      skills: ["fiber_splicing", "tower_climbing", "router_configuration"],
      availability: {
        schedule: [
          { day: "monday", start: "08:00", end: "17:00" },
          { day: "tuesday", start: "08:00", end: "17:00" },
          { day: "wednesday", start: "08:00", end: "17:00" },
          { day: "thursday", start: "08:00", end: "17:00" },
          { day: "friday", start: "08:00", end: "17:00" }
        ]
      },
      currentLocation: { latitude: -29.8587, longitude: 31.0218 },
      isAvailable: true,
      vehicleId: "VAN-1234"
    });

    this.createFieldServiceJob({
      title: "Fiber Installation - 123 Main St",
      description: "New fiber installation for residential customer",
      customerId: 1,
      status: "scheduled",
      priority: "medium",
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 2)),
      locationData: { 
        address: "123 Main St, Durban",
        coordinates: { latitude: -29.8587, longitude: 31.0218 }
      },
      requiredSkills: ["fiber_splicing", "router_configuration"],
      requiredEquipment: ["fusion_splicer", "fiber_tester", "router"],
      estimatedDuration: 180
    });

    // Initialize Network Performance Visualization data
    this.createNetworkVisualization({
      name: "Network Congestion Heatmap",
      description: "Real-time heatmap showing network congestion points",
      visualizationType: "heatmap",
      settings: {
        refreshRate: 60,
        colorScale: ["green", "yellow", "orange", "red"],
        thresholds: [30, 60, 90]
      },
      isPublic: true,
      createdBy: 1
    });

    this.createCustomDashboard({
      name: "Executive Overview",
      description: "High-level network and business metrics for executives",
      ownerId: 1,
      isPublic: true,
      layout: "grid-3x3",
      widgets: [
        { type: "revenue_chart", position: { x: 0, y: 0, w: 2, h: 1 } },
        { type: "customer_growth", position: { x: 2, y: 0, w: 1, h: 1 } },
        { type: "network_health", position: { x: 0, y: 1, w: 1, h: 1 } },
        { type: "top_issues", position: { x: 1, y: 1, w: 2, h: 1 } },
        { type: "forecast", position: { x: 0, y: 2, w: 3, h: 1 } }
      ],
      category: "executive"
    });

    // Initialize Multi-Service Integration data
    this.createServiceIntegration({
      name: "VoIP Provider Integration",
      serviceType: "voice",
      provider: "VoiceFlow",
      apiCredentials: { apiKey: "********", apiEndpoint: "https://api.voiceflow.example" },
      integrationStatus: "active",
      settings: {
        callRouting: "load_balanced",
        failover: true,
        qualityMonitoring: true
      }
    });

    this.createServiceBundle({
      name: "Premium Home Bundle",
      description: "High-speed internet with VoIP and premium streaming services",
      includesInternet: true,
      includesVoice: true,
      includesValueAdded: true,
      price: 129900, // R1,299.00
      discount: 20000, // R200.00
      isActive: true,
      bundleComponents: [
        { type: "internet", plan: "Premium", details: { speed: "100Mbps", data: "Unlimited" } },
        { type: "voice", plan: "Family", details: { lines: 2, minutes: 1000 } },
        { type: "streaming", plan: "Premium", details: { services: ["StreamPlus", "MusicMax"] } }
      ]
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.username === username
    );
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.currentCustomerId++;
    const newCustomer: Customer = { ...customer, id, createdAt: new Date() };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = await this.getCustomer(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  async listCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async searchCustomers(term: string): Promise<Customer[]> {
    const lowercaseTerm = term.toLowerCase();
    return Array.from(this.customers.values()).filter(customer => 
      customer.username.toLowerCase().includes(lowercaseTerm) || 
      customer.email.toLowerCase().includes(lowercaseTerm) || 
      customer.fullName.toLowerCase().includes(lowercaseTerm)
    );
  }
  
  // Plan methods
  async getPlan(id: number): Promise<Plan | undefined> {
    return this.plans.get(id);
  }
  
  async createPlan(plan: InsertPlan): Promise<Plan> {
    const id = this.currentPlanId++;
    const newPlan: Plan = { ...plan, id };
    this.plans.set(id, newPlan);
    return newPlan;
  }
  
  async updatePlan(id: number, planData: Partial<Plan>): Promise<Plan | undefined> {
    const plan = await this.getPlan(id);
    if (!plan) return undefined;
    
    const updatedPlan = { ...plan, ...planData };
    this.plans.set(id, updatedPlan);
    return updatedPlan;
  }
  
  async deletePlan(id: number): Promise<boolean> {
    return this.plans.delete(id);
  }
  
  async listPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }
  
  // Subscription methods
  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }
  
  async getSubscriptionByCustomerId(customerId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (subscription) => subscription.customerId === customerId
    );
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const newSubscription: Subscription = { ...subscription, id };
    this.subscriptions.set(id, newSubscription);
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = await this.getSubscription(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...subscriptionData };
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  async deleteSubscription(id: number): Promise<boolean> {
    return this.subscriptions.delete(id);
  }
  
  async listSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }
  
  // Usage methods
  async createUsage(usage: InsertUsage): Promise<Usage> {
    const id = this.currentUsageId++;
    const newUsage: Usage = { ...usage, id };
    this.usages.set(id, newUsage);
    return newUsage;
  }
  
  async getCustomerUsage(customerId: number): Promise<Usage[]> {
    return Array.from(this.usages.values()).filter(
      (usage) => usage.customerId === customerId
    );
  }
  
  async getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]> {
    return Array.from(this.usages.values()).filter(
      (usage) => usage.customerId === customerId && 
        usage.date >= startDate && 
        usage.date <= endDate
    );
  }
  
  async getTotalUsage(startDate: Date, endDate: Date): Promise<Usage[]> {
    return Array.from(this.usages.values()).filter(
      (usage) => usage.date >= startDate && usage.date <= endDate
    );
  }
  
  async getTopCustomersByUsage(limit: number, startDate: Date, endDate: Date): Promise<TopCustomer[]> {
    const usageData = Array.from(this.usages.values()).filter(
      (usage) => usage.date >= startDate && usage.date <= endDate
    );
    
    const customerUsages = new Map<number, number>();
    
    for (const usage of usageData) {
      const totalUsage = usage.downloadUsage + usage.uploadUsage;
      const current = customerUsages.get(usage.customerId) || 0;
      customerUsages.set(usage.customerId, current + totalUsage);
    }
    
    // Convert to array and sort by usage
    const sortedUsages = Array.from(customerUsages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    // Get total usage for percentage calculation
    const totalOverallUsage = Array.from(customerUsages.values()).reduce((sum, usage) => sum + usage, 0);
    
    // Get customer details
    const result: TopCustomer[] = [];
    
    for (const [customerId, usage] of sortedUsages) {
      const customer = await this.getCustomer(customerId);
      if (!customer) continue;
      
      const subscription = await this.getSubscriptionByCustomerId(customerId);
      if (!subscription) continue;
      
      const plan = await this.getPlan(subscription.planId);
      if (!plan) continue;
      
      result.push({
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        plan: plan.name,
        speed: `${plan.downloadSpeed} Mbps`,
        usage: parseFloat((usage / 1024).toFixed(1)), // Convert to TB
        percentage: Math.floor((usage / totalOverallUsage) * 100),
        status: customer.status
      });
    }
    
    return result;
  }
  
  async getBandwidthUsageOverTime(days: number): Promise<BandwidthUsage[]> {
    const result: BandwidthUsage[] = [];
    const today = new Date();
    
    // Generate dates for the past 'days' days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Format date as yyyy-MM-dd
      const dateString = date.toISOString().split('T')[0];
      
      // Get all usage for that day
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const usages = await this.getTotalUsage(dayStart, dayEnd);
      
      const totalDownload = usages.reduce((sum, usage) => sum + usage.downloadUsage, 0);
      const totalUpload = usages.reduce((sum, usage) => sum + usage.uploadUsage, 0);
      
      result.push({
        date: dateString,
        download: parseFloat((totalDownload / 1024).toFixed(1)), // Convert to TB
        upload: parseFloat((totalUpload / 1024).toFixed(1))      // Convert to TB
      });
    }
    
    return result;
  }
  
  // Billing methods
  async getBilling(id: number): Promise<Billing | undefined> {
    return this.billings.get(id);
  }
  
  async createBilling(billing: InsertBilling): Promise<Billing> {
    const id = this.currentBillingId++;
    const newBilling: Billing = { ...billing, id, createdAt: new Date() };
    this.billings.set(id, newBilling);
    return newBilling;
  }
  
  async updateBilling(id: number, billingData: Partial<Billing>): Promise<Billing | undefined> {
    const billing = await this.getBilling(id);
    if (!billing) return undefined;
    
    const updatedBilling = { ...billing, ...billingData };
    this.billings.set(id, updatedBilling);
    return updatedBilling;
  }
  
  async listBillingsByCustomerId(customerId: number): Promise<Billing[]> {
    return Array.from(this.billings.values()).filter(
      (billing) => billing.customerId === customerId
    );
  }
  
  async listPendingBillings(): Promise<Billing[]> {
    return Array.from(this.billings.values()).filter(
      (billing) => billing.status === 'pending'
    );
  }
  
  // Ticket methods
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const id = this.currentTicketId++;
    const now = new Date();
    const newTicket: Ticket = { 
      ...ticket, 
      id, 
      createdAt: now,
      updatedAt: now,
      closedAt: undefined 
    };
    this.tickets.set(id, newTicket);
    return newTicket;
  }
  
  async updateTicket(id: number, ticketData: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = await this.getTicket(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { 
      ...ticket, 
      ...ticketData,
      updatedAt: new Date()
    };
    
    // If status changed to closed or resolved, set closedAt
    if ((ticketData.status === 'closed' || ticketData.status === 'resolved') && 
        ticket.status !== 'closed' && ticket.status !== 'resolved') {
      updatedTicket.closedAt = new Date();
    }
    
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  async listTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values());
  }
  
  async listTicketsByCustomerId(customerId: number): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.customerId === customerId
    );
  }
  
  async listOpenTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(
      (ticket) => ticket.status === 'open' || ticket.status === 'in_progress'
    );
  }
  
  // Ticket Comment methods
  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const id = this.currentTicketCommentId++;
    const newComment: TicketComment = { ...comment, id, createdAt: new Date() };
    this.ticketComments.set(id, newComment);
    return newComment;
  }
  
  async listTicketCommentsByTicketId(ticketId: number): Promise<TicketComment[]> {
    return Array.from(this.ticketComments.values())
      .filter((comment) => comment.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  // RADIUS Client methods
  async getRadiusClient(id: number): Promise<RadiusClient | undefined> {
    return this.radiusClients.get(id);
  }
  
  async getRadiusClientByIp(ipAddress: string): Promise<RadiusClient | undefined> {
    return Array.from(this.radiusClients.values()).find(
      (client) => client.ipAddress === ipAddress
    );
  }
  
  async createRadiusClient(client: InsertRadiusClient): Promise<RadiusClient> {
    const id = this.currentRadiusClientId++;
    const newClient: RadiusClient = { ...client, id };
    this.radiusClients.set(id, newClient);
    return newClient;
  }
  
  async updateRadiusClient(id: number, clientData: Partial<RadiusClient>): Promise<RadiusClient | undefined> {
    const client = await this.getRadiusClient(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.radiusClients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteRadiusClient(id: number): Promise<boolean> {
    return this.radiusClients.delete(id);
  }
  
  async listRadiusClients(): Promise<RadiusClient[]> {
    return Array.from(this.radiusClients.values());
  }
  
  // RADIUS Auth methods
  async createRadiusAuth(auth: InsertRadiusAuth): Promise<RadiusAuth> {
    const id = this.currentRadiusAuthId++;
    const newAuth: RadiusAuth = { ...auth, id, timestamp: new Date() };
    this.radiusAuth.set(id, newAuth);
    return newAuth;
  }
  
  async listRadiusAuth(limit: number): Promise<RadiusAuth[]> {
    return Array.from(this.radiusAuth.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async getRadiusAuthsByUsername(username: string, limit: number): Promise<RadiusAuth[]> {
    return Array.from(this.radiusAuth.values())
      .filter(auth => auth.username === username)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async getRadiusAuthsByTimeRange(startDate: Date, endDate: Date): Promise<RadiusAuth[]> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    return Array.from(this.radiusAuth.values())
      .filter(auth => {
        const authTime = auth.timestamp.getTime();
        return authTime >= startTime && authTime <= endTime;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getCustomerCount(): Promise<number> {
    // Get total count of customers
    return this.customers.size;
  }
  
  async getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]> {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    return Array.from(this.usages.values())
      .filter(usage => {
        return usage.customerId === customerId && 
               usage.date.getTime() >= startTime && 
               usage.date.getTime() <= endTime;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Activity Log methods
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const newLog: ActivityLog = { ...log, id, timestamp: new Date() };
    this.activityLogs.set(id, newLog);
    return newLog;
  }
  
  async listRecentActivityLogs(limit: number): Promise<RecentActivity[]> {
    const logs = Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    
    const result: RecentActivity[] = [];
    
    for (const log of logs) {
      let type: 'customer' | 'ticket' | 'resolved' | 'alert' = 'customer';
      
      if (log.action.includes('Ticket') && log.action.includes('Resolved')) {
        type = 'resolved';
      } else if (log.action.includes('Ticket')) {
        type = 'ticket';
      } else if (log.action.includes('Alert') || log.action.includes('Warning')) {
        type = 'alert';
      }
      
      result.push({
        id: log.id,
        type,
        message: log.details || log.action,
        timestamp: log.timestamp
      });
    }
    
    return result;
  }
  
  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const customerCount = this.customers.size;
    const activeCustomers = Array.from(this.customers.values()).filter(c => c.status === 'active').length;
    
    // Calculate a fake growth percentage
    const customersGrowth = 3.2;
    
    // Get active sessions (use active customers as proxy)
    const activeSessions = Math.round(activeCustomers * 0.85); // Assume 85% of customers are online
    const sessionsGrowth = 5.4;
    
    // Get open tickets
    const openTickets = (await this.listOpenTickets()).length;
    const ticketsGrowth = 8.1; // Assume 8.1% increase
    
    // Get total bandwidth usage in TB
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const usages = await this.getTotalUsage(oneMonthAgo, new Date());
    const totalDownload = usages.reduce((sum, usage) => sum + usage.downloadUsage, 0);
    const totalUpload = usages.reduce((sum, usage) => sum + usage.uploadUsage, 0);
    
    const bandwidthUsage = parseFloat(((totalDownload + totalUpload) / 1024).toFixed(1)); // Convert to TB
    const bandwidthGrowth = 12.5;
    
    return {
      totalCustomers: customerCount,
      customersGrowth,
      activeSessions,
      sessionsGrowth,
      openTickets,
      ticketsGrowth,
      bandwidthUsage,
      bandwidthGrowth
    };
  }
  
  // Network Devices
  async getNetworkDevice(id: number): Promise<NetworkDevice | undefined> {
    return this.networkDevices.get(id);
  }
  
  async createNetworkDevice(device: InsertNetworkDevice): Promise<NetworkDevice> {
    const id = this.currentNetworkDeviceId++;
    const newDevice: NetworkDevice = { ...device, id };
    this.networkDevices.set(id, newDevice);
    return newDevice;
  }
  
  async updateNetworkDevice(id: number, deviceData: Partial<NetworkDevice>): Promise<NetworkDevice | undefined> {
    const device = await this.getNetworkDevice(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...deviceData };
    this.networkDevices.set(id, updatedDevice);
    return updatedDevice;
  }
  
  async deleteNetworkDevice(id: number): Promise<boolean> {
    // First, delete any connections that use this device
    Array.from(this.networkConnections.values())
      .filter(conn => conn.sourceDeviceId === id || conn.targetDeviceId === id)
      .forEach(conn => this.networkConnections.delete(conn.id));
    
    // Then delete the device metrics
    Array.from(this.networkMetrics.values())
      .filter(metric => metric.deviceId === id)
      .forEach(metric => this.networkMetrics.delete(metric.id));
    
    // Finally delete the device
    return this.networkDevices.delete(id);
  }
  
  async listNetworkDevices(): Promise<NetworkDevice[]> {
    return Array.from(this.networkDevices.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async updateNetworkDeviceCoordinates(id: number, coordinates: { x: number, y: number }): Promise<NetworkDevice | undefined> {
    const device = await this.getNetworkDevice(id);
    if (!device) return undefined;
    
    const updatedDevice = { 
      ...device, 
      coordinates: coordinates
    };
    this.networkDevices.set(id, updatedDevice);
    return updatedDevice;
  }
  
  // Network Connections
  async getNetworkConnection(id: number): Promise<NetworkConnection | undefined> {
    return this.networkConnections.get(id);
  }
  
  async createNetworkConnection(connection: InsertNetworkConnection): Promise<NetworkConnection> {
    const id = this.currentNetworkConnectionId++;
    const newConnection: NetworkConnection = { ...connection, id };
    this.networkConnections.set(id, newConnection);
    return newConnection;
  }
  
  async updateNetworkConnection(id: number, connectionData: Partial<NetworkConnection>): Promise<NetworkConnection | undefined> {
    const connection = await this.getNetworkConnection(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, ...connectionData };
    this.networkConnections.set(id, updatedConnection);
    return updatedConnection;
  }
  
  async deleteNetworkConnection(id: number): Promise<boolean> {
    return this.networkConnections.delete(id);
  }
  
  async listNetworkConnections(): Promise<NetworkConnection[]> {
    return Array.from(this.networkConnections.values());
  }
  
  // Network Metrics
  async createNetworkMetric(metric: InsertNetworkMetric): Promise<NetworkMetric> {
    const id = this.currentNetworkMetricId++;
    const newMetric: NetworkMetric = { ...metric, id, timestamp: new Date() };
    this.networkMetrics.set(id, newMetric);
    return newMetric;
  }
  
  async listNetworkMetrics(limit: number): Promise<NetworkMetric[]> {
    return Array.from(this.networkMetrics.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  async getNetworkMetricsByDeviceId(deviceId: number, limit: number): Promise<NetworkMetric[]> {
    return Array.from(this.networkMetrics.values())
      .filter(metric => metric.deviceId === deviceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 1. AI-Powered Network Optimization Methods
  async getNetworkOptimization(id: number): Promise<NetworkOptimization | undefined> {
    return this.networkOptimizations.get(id);
  }

  async createNetworkOptimization(optimization: InsertNetworkOptimization): Promise<NetworkOptimization> {
    const id = this.currentNetworkOptimizationId++;
    const newOptimization: NetworkOptimization = { ...optimization, id, createdAt: new Date() };
    this.networkOptimizations.set(id, newOptimization);
    return newOptimization;
  }

  async updateNetworkOptimization(id: number, optimization: Partial<NetworkOptimization>): Promise<NetworkOptimization | undefined> {
    const existingOptimization = await this.getNetworkOptimization(id);
    if (!existingOptimization) return undefined;
    
    const updatedOptimization = { ...existingOptimization, ...optimization };
    this.networkOptimizations.set(id, updatedOptimization);
    return updatedOptimization;
  }

  async deleteNetworkOptimization(id: number): Promise<boolean> {
    return this.networkOptimizations.delete(id);
  }

  async listNetworkOptimizations(): Promise<NetworkOptimization[]> {
    return Array.from(this.networkOptimizations.values());
  }

  // 2. Enhanced Security Suite Methods
  async getSecurityAudit(id: number): Promise<SecurityAudit | undefined> {
    return this.securityAudits.get(id);
  }

  async createSecurityAudit(audit: InsertSecurityAudit): Promise<SecurityAudit> {
    const id = this.currentSecurityAuditId++;
    const newAudit: SecurityAudit = { ...audit, id, createdAt: new Date() };
    this.securityAudits.set(id, newAudit);
    return newAudit;
  }

  async updateSecurityAudit(id: number, audit: Partial<SecurityAudit>): Promise<SecurityAudit | undefined> {
    const existingAudit = await this.getSecurityAudit(id);
    if (!existingAudit) return undefined;
    
    const updatedAudit = { ...existingAudit, ...audit };
    this.securityAudits.set(id, updatedAudit);
    return updatedAudit;
  }

  async listSecurityAudits(): Promise<SecurityAudit[]> {
    return Array.from(this.securityAudits.values());
  }

  async getSecurityThreat(id: number): Promise<SecurityThreat | undefined> {
    return this.securityThreats.get(id);
  }

  async createSecurityThreat(threat: InsertSecurityThreat): Promise<SecurityThreat> {
    const id = this.currentSecurityThreatId++;
    const newThreat: SecurityThreat = { ...threat, id, detectedAt: new Date() };
    this.securityThreats.set(id, newThreat);
    return newThreat;
  }

  async updateSecurityThreat(id: number, threat: Partial<SecurityThreat>): Promise<SecurityThreat | undefined> {
    const existingThreat = await this.getSecurityThreat(id);
    if (!existingThreat) return undefined;
    
    const updatedThreat = { ...existingThreat, ...threat };
    this.securityThreats.set(id, updatedThreat);
    return updatedThreat;
  }

  async resolveSecurityThreat(id: number): Promise<SecurityThreat | undefined> {
    const threat = await this.getSecurityThreat(id);
    if (!threat) return undefined;
    
    const resolvedThreat = { 
      ...threat, 
      status: 'resolved', 
      resolvedAt: new Date() 
    };
    this.securityThreats.set(id, resolvedThreat);
    return resolvedThreat;
  }

  async listSecurityThreats(): Promise<SecurityThreat[]> {
    return Array.from(this.securityThreats.values());
  }

  async listActiveSecurityThreats(): Promise<SecurityThreat[]> {
    return Array.from(this.securityThreats.values())
      .filter(threat => threat.status === 'active');
  }

  // 3. Customer Self-Service Portal Methods
  async getCustomerPortalSettings(customerId: number): Promise<CustomerPortalSetting | undefined> {
    return Array.from(this.customerPortalSettings.values())
      .find(settings => settings.customerId === customerId);
  }

  async createCustomerPortalSettings(settings: InsertCustomerPortalSetting): Promise<CustomerPortalSetting> {
    const id = this.currentUsageAlertId++;
    const newSettings: CustomerPortalSetting = { 
      ...settings, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customerPortalSettings.set(id, newSettings);
    return newSettings;
  }

  async updateCustomerPortalSettings(customerId: number, settingsData: Partial<CustomerPortalSetting>): Promise<CustomerPortalSetting | undefined> {
    const settings = await this.getCustomerPortalSettings(customerId);
    if (!settings) return undefined;
    
    const updatedSettings = { 
      ...settings, 
      ...settingsData,
      updatedAt: new Date()
    };
    this.customerPortalSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }

  async getUsageAlert(id: number): Promise<UsageAlert | undefined> {
    return this.usageAlerts.get(id);
  }

  async createUsageAlert(alert: InsertUsageAlert): Promise<UsageAlert> {
    const id = this.currentUsageAlertId++;
    const newAlert: UsageAlert = { ...alert, id, createdAt: new Date() };
    this.usageAlerts.set(id, newAlert);
    return newAlert;
  }

  async updateUsageAlert(id: number, alert: Partial<UsageAlert>): Promise<UsageAlert | undefined> {
    const existingAlert = await this.getUsageAlert(id);
    if (!existingAlert) return undefined;
    
    const updatedAlert = { ...existingAlert, ...alert };
    this.usageAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteUsageAlert(id: number): Promise<boolean> {
    return this.usageAlerts.delete(id);
  }

  async listUsageAlertsByCustomerId(customerId: number): Promise<UsageAlert[]> {
    return Array.from(this.usageAlerts.values())
      .filter(alert => alert.customerId === customerId);
  }

  // 4. Advanced Revenue Management Methods
  async getRevenueForecast(id: number): Promise<RevenueForecast | undefined> {
    return this.revenueForecast.get(id);
  }

  async createRevenueForecast(forecast: InsertRevenueForecast): Promise<RevenueForecast> {
    const id = this.currentRevenueForecastId++;
    const newForecast: RevenueForecast = { 
      ...forecast, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.revenueForecast.set(id, newForecast);
    return newForecast;
  }

  async updateRevenueForecast(id: number, forecast: Partial<RevenueForecast>): Promise<RevenueForecast | undefined> {
    const existingForecast = await this.getRevenueForecast(id);
    if (!existingForecast) return undefined;
    
    const updatedForecast = { 
      ...existingForecast, 
      ...forecast,
      updatedAt: new Date()
    };
    this.revenueForecast.set(id, updatedForecast);
    return updatedForecast;
  }

  async listRevenueForecastsByYear(year: number): Promise<RevenueForecast[]> {
    return Array.from(this.revenueForecast.values())
      .filter(forecast => forecast.year === year);
  }

  async getDynamicPricingRule(id: number): Promise<DynamicPricingRule | undefined> {
    return this.dynamicPricingRules.get(id);
  }

  async createDynamicPricingRule(rule: InsertDynamicPricingRule): Promise<DynamicPricingRule> {
    const id = this.currentDynamicPricingRuleId++;
    const newRule: DynamicPricingRule = { 
      ...rule, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      appliedCount: 0
    };
    this.dynamicPricingRules.set(id, newRule);
    return newRule;
  }

  async updateDynamicPricingRule(id: number, rule: Partial<DynamicPricingRule>): Promise<DynamicPricingRule | undefined> {
    const existingRule = await this.getDynamicPricingRule(id);
    if (!existingRule) return undefined;
    
    const updatedRule = { 
      ...existingRule, 
      ...rule,
      updatedAt: new Date()
    };
    this.dynamicPricingRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteDynamicPricingRule(id: number): Promise<boolean> {
    return this.dynamicPricingRules.delete(id);
  }

  async listDynamicPricingRules(): Promise<DynamicPricingRule[]> {
    return Array.from(this.dynamicPricingRules.values());
  }

  async listActiveDynamicPricingRules(): Promise<DynamicPricingRule[]> {
    return Array.from(this.dynamicPricingRules.values())
      .filter(rule => rule.isActive);
  }

  // 5. Field Service Management Methods
  async getFieldTechnician(id: number): Promise<FieldTechnician | undefined> {
    return this.fieldTechnicians.get(id);
  }

  async createFieldTechnician(technician: InsertFieldTechnician): Promise<FieldTechnician> {
    const id = this.currentFieldTechnicianId++;
    const newTechnician: FieldTechnician = { 
      ...technician, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fieldTechnicians.set(id, newTechnician);
    return newTechnician;
  }

  async updateFieldTechnician(id: number, technician: Partial<FieldTechnician>): Promise<FieldTechnician | undefined> {
    const existingTechnician = await this.getFieldTechnician(id);
    if (!existingTechnician) return undefined;
    
    const updatedTechnician = { 
      ...existingTechnician, 
      ...technician,
      updatedAt: new Date()
    };
    this.fieldTechnicians.set(id, updatedTechnician);
    return updatedTechnician;
  }

  async listFieldTechnicians(): Promise<FieldTechnician[]> {
    return Array.from(this.fieldTechnicians.values());
  }

  async listAvailableFieldTechnicians(): Promise<FieldTechnician[]> {
    return Array.from(this.fieldTechnicians.values())
      .filter(tech => tech.isAvailable);
  }

  async getFieldServiceJob(id: number): Promise<FieldServiceJob | undefined> {
    return this.fieldServiceJobs.get(id);
  }

  async createFieldServiceJob(job: InsertFieldServiceJob): Promise<FieldServiceJob> {
    const id = this.currentFieldServiceJobId++;
    const newJob: FieldServiceJob = { 
      ...job, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fieldServiceJobs.set(id, newJob);
    return newJob;
  }

  async updateFieldServiceJob(id: number, job: Partial<FieldServiceJob>): Promise<FieldServiceJob | undefined> {
    const existingJob = await this.getFieldServiceJob(id);
    if (!existingJob) return undefined;
    
    const updatedJob = { 
      ...existingJob, 
      ...job,
      updatedAt: new Date()
    };
    this.fieldServiceJobs.set(id, updatedJob);
    return updatedJob;
  }

  async assignTechnicianToJob(jobId: number, technicianId: number): Promise<FieldServiceJob | undefined> {
    const job = await this.getFieldServiceJob(jobId);
    const technician = await this.getFieldTechnician(technicianId);
    
    if (!job || !technician) return undefined;
    
    const updatedJob = { 
      ...job, 
      technicianId,
      status: 'assigned',
      updatedAt: new Date()
    };
    this.fieldServiceJobs.set(jobId, updatedJob);
    
    // Update technician availability
    const updatedTechnician = {
      ...technician,
      isAvailable: false,
      updatedAt: new Date()
    };
    this.fieldTechnicians.set(technicianId, updatedTechnician);
    
    return updatedJob;
  }

  async completeFieldServiceJob(id: number): Promise<FieldServiceJob | undefined> {
    const job = await this.getFieldServiceJob(id);
    if (!job) return undefined;
    
    const completedJob = { 
      ...job, 
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date()
    };
    this.fieldServiceJobs.set(id, completedJob);
    
    // If a technician was assigned, mark them as available again
    if (job.technicianId) {
      const technician = await this.getFieldTechnician(job.technicianId);
      if (technician) {
        const updatedTechnician = {
          ...technician,
          isAvailable: true,
          updatedAt: new Date()
        };
        this.fieldTechnicians.set(job.technicianId, updatedTechnician);
      }
    }
    
    return completedJob;
  }

  async listFieldServiceJobs(): Promise<FieldServiceJob[]> {
    return Array.from(this.fieldServiceJobs.values());
  }

  async listFieldServiceJobsByStatus(status: string): Promise<FieldServiceJob[]> {
    return Array.from(this.fieldServiceJobs.values())
      .filter(job => job.status === status);
  }

  async listFieldServiceJobsByCustomerId(customerId: number): Promise<FieldServiceJob[]> {
    return Array.from(this.fieldServiceJobs.values())
      .filter(job => job.customerId === customerId);
  }

  // 6. Network Performance Visualization Methods
  async getNetworkVisualization(id: number): Promise<NetworkVisualization | undefined> {
    return this.networkVisualizations.get(id);
  }

  async createNetworkVisualization(visualization: InsertNetworkVisualization): Promise<NetworkVisualization> {
    const id = this.currentNetworkVisualizationId++;
    const newVisualization: NetworkVisualization = { 
      ...visualization, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date()
    };
    this.networkVisualizations.set(id, newVisualization);
    return newVisualization;
  }

  async updateNetworkVisualization(id: number, visualization: Partial<NetworkVisualization>): Promise<NetworkVisualization | undefined> {
    const existingVisualization = await this.getNetworkVisualization(id);
    if (!existingVisualization) return undefined;
    
    const updatedVisualization = { 
      ...existingVisualization, 
      ...visualization,
      updatedAt: new Date()
    };
    this.networkVisualizations.set(id, updatedVisualization);
    return updatedVisualization;
  }

  async deleteNetworkVisualization(id: number): Promise<boolean> {
    return this.networkVisualizations.delete(id);
  }

  async listNetworkVisualizations(): Promise<NetworkVisualization[]> {
    return Array.from(this.networkVisualizations.values());
  }

  async getCustomDashboard(id: number): Promise<CustomDashboard | undefined> {
    return this.customDashboards.get(id);
  }

  async createCustomDashboard(dashboard: InsertCustomDashboard): Promise<CustomDashboard> {
    const id = this.currentCustomDashboardId++;
    const newDashboard: CustomDashboard = { 
      ...dashboard, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customDashboards.set(id, newDashboard);
    return newDashboard;
  }

  async updateCustomDashboard(id: number, dashboard: Partial<CustomDashboard>): Promise<CustomDashboard | undefined> {
    const existingDashboard = await this.getCustomDashboard(id);
    if (!existingDashboard) return undefined;
    
    const updatedDashboard = { 
      ...existingDashboard, 
      ...dashboard,
      updatedAt: new Date()
    };
    this.customDashboards.set(id, updatedDashboard);
    return updatedDashboard;
  }

  async deleteCustomDashboard(id: number): Promise<boolean> {
    return this.customDashboards.delete(id);
  }

  async listCustomDashboards(): Promise<CustomDashboard[]> {
    return Array.from(this.customDashboards.values());
  }

  async listCustomDashboardsByOwnerId(ownerId: number): Promise<CustomDashboard[]> {
    return Array.from(this.customDashboards.values())
      .filter(dashboard => dashboard.ownerId === ownerId);
  }

  // 7. Multi-Service Integration Methods
  async getServiceIntegration(id: number): Promise<ServiceIntegration | undefined> {
    return this.serviceIntegrations.get(id);
  }

  async createServiceIntegration(integration: InsertServiceIntegration): Promise<ServiceIntegration> {
    const id = this.currentServiceIntegrationId++;
    const newIntegration: ServiceIntegration = { 
      ...integration, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.serviceIntegrations.set(id, newIntegration);
    return newIntegration;
  }

  async updateServiceIntegration(id: number, integration: Partial<ServiceIntegration>): Promise<ServiceIntegration | undefined> {
    const existingIntegration = await this.getServiceIntegration(id);
    if (!existingIntegration) return undefined;
    
    const updatedIntegration = { 
      ...existingIntegration, 
      ...integration,
      updatedAt: new Date()
    };
    this.serviceIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }

  async deleteServiceIntegration(id: number): Promise<boolean> {
    return this.serviceIntegrations.delete(id);
  }

  async listServiceIntegrations(): Promise<ServiceIntegration[]> {
    return Array.from(this.serviceIntegrations.values());
  }

  async getServiceBundle(id: number): Promise<ServiceBundle | undefined> {
    return this.serviceBundles.get(id);
  }

  async createServiceBundle(bundle: InsertServiceBundle): Promise<ServiceBundle> {
    const id = this.currentServiceBundleId++;
    const newBundle: ServiceBundle = { 
      ...bundle, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.serviceBundles.set(id, newBundle);
    return newBundle;
  }

  async updateServiceBundle(id: number, bundle: Partial<ServiceBundle>): Promise<ServiceBundle | undefined> {
    const existingBundle = await this.getServiceBundle(id);
    if (!existingBundle) return undefined;
    
    const updatedBundle = { 
      ...existingBundle, 
      ...bundle,
      updatedAt: new Date()
    };
    this.serviceBundles.set(id, updatedBundle);
    return updatedBundle;
  }

  async deleteServiceBundle(id: number): Promise<boolean> {
    return this.serviceBundles.delete(id);
  }

  async listServiceBundles(): Promise<ServiceBundle[]> {
    return Array.from(this.serviceBundles.values());
  }

  async listActiveServiceBundles(): Promise<ServiceBundle[]> {
    return Array.from(this.serviceBundles.values())
      .filter(bundle => bundle.isActive);
  }

  // IP Network methods (IPAM)
  async getIpNetwork(id: number): Promise<IpNetwork | undefined> {
    return this.ipNetworks.get(id);
  }
  
  async createIpNetwork(network: InsertIpNetwork): Promise<IpNetwork> {
    const id = this.currentIpNetworkId++;
    const newNetwork: IpNetwork = { ...network, id, createdAt: new Date() };
    this.ipNetworks.set(id, newNetwork);
    return newNetwork;
  }
  
  async updateIpNetwork(id: number, network: Partial<IpNetwork>): Promise<IpNetwork | undefined> {
    const existingNetwork = await this.getIpNetwork(id);
    if (!existingNetwork) return undefined;
    
    const updatedNetwork = { ...existingNetwork, ...network };
    this.ipNetworks.set(id, updatedNetwork);
    return updatedNetwork;
  }
  
  async deleteIpNetwork(id: number): Promise<boolean> {
    return this.ipNetworks.delete(id);
  }
  
  async listIpNetworks(): Promise<IpNetwork[]> {
    return Array.from(this.ipNetworks.values());
  }
  
  // IP Address methods (IPAM)
  async getIpAddress(id: number): Promise<IpAddress | undefined> {
    return this.ipAddresses.get(id);
  }
  
  async createIpAddress(address: InsertIpAddress): Promise<IpAddress> {
    const id = this.currentIpAddressId++;
    const newAddress: IpAddress = { ...address, id, createdAt: new Date() };
    this.ipAddresses.set(id, newAddress);
    return newAddress;
  }
  
  async updateIpAddress(id: number, address: Partial<IpAddress>): Promise<IpAddress | undefined> {
    const existingAddress = await this.getIpAddress(id);
    if (!existingAddress) return undefined;
    
    const updatedAddress = { ...existingAddress, ...address };
    this.ipAddresses.set(id, updatedAddress);
    return updatedAddress;
  }
  
  async deleteIpAddress(id: number): Promise<boolean> {
    return this.ipAddresses.delete(id);
  }
  
  async listIpAddresses(): Promise<IpAddress[]> {
    return Array.from(this.ipAddresses.values());
  }
  
  async getIpAddressesByNetworkId(networkId: number): Promise<IpAddress[]> {
    return Array.from(this.ipAddresses.values())
      .filter(address => address.networkId === networkId);
  }
}

// Create a DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }
  
  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.username, username));
    return customer || undefined;
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }
  
  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set(customerData)
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(eq(customers.id, id));
    return true;
  }
  
  async listCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }
  
  async searchCustomers(term: string): Promise<Customer[]> {
    const lowercaseTerm = term.toLowerCase();
    
    return await db
      .select()
      .from(customers)
      .where(
        or(
          sql`lower(${customers.fullName}) like ${`%${lowercaseTerm}%`}`,
          sql`lower(${customers.email}) like ${`%${lowercaseTerm}%`}`,
          sql`lower(${customers.phone}) like ${`%${lowercaseTerm}%`}`,
          sql`lower(${customers.address}) like ${`%${lowercaseTerm}%`}`
        )
      );
  }
  
  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan || undefined;
  }
  
  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db
      .insert(plans)
      .values(plan)
      .returning();
    return newPlan;
  }
  
  async updatePlan(id: number, planData: Partial<Plan>): Promise<Plan | undefined> {
    const [plan] = await db
      .update(plans)
      .set(planData)
      .where(eq(plans.id, id))
      .returning();
    return plan || undefined;
  }
  
  async deletePlan(id: number): Promise<boolean> {
    await db
      .delete(plans)
      .where(eq(plans.id, id));
    return true;
  }
  
  async listPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }
  
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription || undefined;
  }
  
  async getSubscriptionByCustomerId(customerId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.customerId, customerId));
    return subscription || undefined;
  }
  
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }
  
  async updateSubscription(id: number, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }
  
  async deleteSubscription(id: number): Promise<boolean> {
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, id));
    return true;
  }
  
  async listSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }
  
  async createUsage(usage: InsertUsage): Promise<Usage> {
    const [newUsage] = await db
      .insert(usages)
      .values(usage)
      .returning();
    return newUsage;
  }
  
  async getCustomerUsage(customerId: number): Promise<Usage[]> {
    return await db
      .select()
      .from(usages)
      .where(eq(usages.customerId, customerId));
  }
  
  async getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]> {
    return await db
      .select()
      .from(usages)
      .where(
        and(
          eq(usages.customerId, customerId),
          gte(usages.timestamp, startDate),
          lte(usages.timestamp, endDate)
        )
      );
  }
  
  async getTotalUsage(startDate: Date, endDate: Date): Promise<Usage[]> {
    return await db
      .select()
      .from(usages)
      .where(
        and(
          gte(usages.timestamp, startDate),
          lte(usages.timestamp, endDate)
        )
      );
  }
  
  async getTopCustomersByUsage(limit: number, startDate: Date, endDate: Date): Promise<TopCustomer[]> {
    const result = await db.execute<TopCustomer>(sql`
      SELECT 
        c.id,
        c.full_name as "fullName",
        c.email,
        p.name as plan,
        p.download_speed as speed,
        SUM(u.download_usage + u.upload_usage) as usage,
        0 as percentage,
        c.status
      FROM 
        ${usages} u
      JOIN 
        ${customers} c ON u.customer_id = c.id
      JOIN 
        ${subscriptions} s ON c.id = s.customer_id
      JOIN 
        ${plans} p ON s.plan_id = p.id
      WHERE 
        u.date BETWEEN ${startDate} AND ${endDate}
      GROUP BY 
        c.id, c.full_name, c.email, p.name, p.download_speed, c.status
      ORDER BY 
        usage DESC
      LIMIT ${limit}
    `);
    
    // Calculate the percentage
    const total = result.reduce((acc, customer) => acc + customer.usage, 0);
    
    return result.map(customer => ({
      ...customer,
      percentage: total > 0 ? (customer.usage / total) * 100 : 0
    }));
  }
  
  async getBandwidthUsageOverTime(days: number): Promise<BandwidthUsage[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.execute<BandwidthUsage>(sql`
      SELECT 
        date_trunc('day', date)::date as date,
        SUM(download_usage) as download,
        SUM(upload_usage) as upload
      FROM 
        ${usages}
      WHERE 
        date BETWEEN ${startDate} AND ${endDate}
      GROUP BY 
        date
      ORDER BY 
        date ASC
    `);
    
    // Handle empty result or result not being an array
    if (!result || !Array.isArray(result)) {
      console.warn('No bandwidth usage data found or result is not an array');
      return [];
    }
    
    return result.map(item => ({
      ...item,
      date: item.date ? item.date.toString() : new Date().toString()
    }));
  }
  
  async getBilling(id: number): Promise<Billing | undefined> {
    const [billing] = await db.select().from(billings).where(eq(billings.id, id));
    return billing || undefined;
  }
  
  async createBilling(billing: InsertBilling): Promise<Billing> {
    const [newBilling] = await db
      .insert(billings)
      .values(billing)
      .returning();
    return newBilling;
  }
  
  async updateBilling(id: number, billingData: Partial<Billing>): Promise<Billing | undefined> {
    const [billing] = await db
      .update(billings)
      .set(billingData)
      .where(eq(billings.id, id))
      .returning();
    return billing || undefined;
  }
  
  async listBillingsByCustomerId(customerId: number): Promise<Billing[]> {
    return await db
      .select()
      .from(billings)
      .where(eq(billings.customerId, customerId))
      .orderBy(desc(billings.dueDate));
  }
  
  async listPendingBillings(): Promise<Billing[]> {
    return await db
      .select()
      .from(billings)
      .where(eq(billings.status, 'pending'))
      .orderBy(asc(billings.dueDate));
  }
  
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return newTicket;
  }
  
  async updateTicket(id: number, ticketData: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set(ticketData)
      .where(eq(tickets.id, id))
      .returning();
    return ticket || undefined;
  }
  
  async listTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt));
  }
  
  async listTicketsByCustomerId(customerId: number): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.customerId, customerId))
      .orderBy(desc(tickets.createdAt));
  }
  
  async listOpenTickets(): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(
        or(
          eq(tickets.status, 'open'),
          eq(tickets.status, 'in_progress')
        )
      )
      .orderBy(asc(tickets.createdAt));
  }
  
  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const [newComment] = await db
      .insert(ticketComments)
      .values(comment)
      .returning();
    return newComment;
  }
  
  async listTicketCommentsByTicketId(ticketId: number): Promise<TicketComment[]> {
    return await db
      .select()
      .from(ticketComments)
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(asc(ticketComments.createdAt));
  }
  
  async getRadiusClient(id: number): Promise<RadiusClient | undefined> {
    const [client] = await db.select().from(radiusClients).where(eq(radiusClients.id, id));
    return client || undefined;
  }
  
  async getRadiusClientByIp(ipAddress: string): Promise<RadiusClient | undefined> {
    const [client] = await db.select().from(radiusClients).where(eq(radiusClients.ipAddress, ipAddress));
    return client || undefined;
  }
  
  async createRadiusClient(client: InsertRadiusClient): Promise<RadiusClient> {
    const [newClient] = await db
      .insert(radiusClients)
      .values(client)
      .returning();
    return newClient;
  }
  
  async updateRadiusClient(id: number, clientData: Partial<RadiusClient>): Promise<RadiusClient | undefined> {
    const [client] = await db
      .update(radiusClients)
      .set(clientData)
      .where(eq(radiusClients.id, id))
      .returning();
    return client || undefined;
  }
  
  async deleteRadiusClient(id: number): Promise<boolean> {
    await db
      .delete(radiusClients)
      .where(eq(radiusClients.id, id));
    return true;
  }
  
  async listRadiusClients(): Promise<RadiusClient[]> {
    return await db.select().from(radiusClients);
  }
  
  async createRadiusAuth(auth: InsertRadiusAuth): Promise<RadiusAuth> {
    const [newAuth] = await db
      .insert(radiusAuth)
      .values(auth)
      .returning();
    return newAuth;
  }
  
  async listRadiusAuth(limit: number): Promise<RadiusAuth[]> {
    return await db
      .select()
      .from(radiusAuth)
      .orderBy(desc(radiusAuth.timestamp))
      .limit(limit);
  }

  async getRadiusAuthsByUsername(username: string, limit: number): Promise<RadiusAuth[]> {
    return await db
      .select()
      .from(radiusAuth)
      .where(eq(radiusAuth.username, username))
      .orderBy(desc(radiusAuth.timestamp))
      .limit(limit);
  }
  
  async getRadiusAuthsByTimeRange(startDate: Date, endDate: Date): Promise<RadiusAuth[]> {
    return await db
      .select()
      .from(radiusAuth)
      .where(
        and(
          gte(radiusAuth.timestamp, startDate),
          lte(radiusAuth.timestamp, endDate)
        )
      )
      .orderBy(desc(radiusAuth.timestamp));
  }
  
  async getCustomerCount(): Promise<number> {
    const result = await db.select({ count: count() }).from(customers);
    return result[0].count;
  }
  
  async getCustomerUsageByDateRange(customerId: number, startDate: Date, endDate: Date): Promise<Usage[]> {
    return await db
      .select()
      .from(usages)
      .where(
        and(
          eq(usages.customerId, customerId),
          gte(usages.date, startDate),
          lte(usages.date, endDate)
        )
      )
      .orderBy(desc(usages.date));
  }
  
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return newLog;
  }
  
  async listRecentActivityLogs(limit: number): Promise<RecentActivity[]> {
    const logs = await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit);
      
    return logs.map(log => ({
      id: log.id,
      type: log.action.toLowerCase().includes('ticket') ? 
        log.action.toLowerCase().includes('resolved') ? 'resolved' : 'ticket' 
        : log.action.toLowerCase().includes('customer') ? 'customer' : 'alert',
      message: log.details,
      timestamp: log.timestamp
    }));
  }
  
  async getDashboardStats(): Promise<DashboardStats> {
    // Get total customers
    const [{ count: totalCustomers }] = await db
      .select({ count: count() })
      .from(customers);
      
    // Get active sessions (in a real app, this would come from an active sessions table)
    const activeSessions = 0;
    
    // Get open tickets count
    const [{ count: openTickets }] = await db
      .select({ count: count() })
      .from(tickets)
      .where(
        or(
          eq(tickets.status, 'open'),
          eq(tickets.status, 'in_progress')
        )
      );
      
    // Get bandwidth usage (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const [{ total: bandwidthUsage }] = await db
      .select({
        total: sum(sql<number>`${usages.downloadUsage} + ${usages.uploadUsage}`)
      })
      .from(usages)
      .where(
        and(
          gte(usages.date, startDate),
          lte(usages.date, endDate)
        )
      );
      
    return {
      totalCustomers: Number(totalCustomers),
      customersGrowth: 0, // Calculate from historical data if available
      activeSessions: activeSessions,
      sessionsGrowth: 0,
      openTickets: Number(openTickets),
      ticketsGrowth: 0,
      bandwidthUsage: Number(bandwidthUsage) || 0,
      bandwidthGrowth: 0
    };
  }

  // Network Devices
  async getNetworkDevice(id: number): Promise<NetworkDevice | undefined> {
    const [device] = await db.select().from(networkDevices).where(eq(networkDevices.id, id));
    return device || undefined;
  }
  
  async createNetworkDevice(device: InsertNetworkDevice): Promise<NetworkDevice> {
    const [newDevice] = await db.insert(networkDevices).values(device).returning();
    return newDevice;
  }
  
  async updateNetworkDevice(id: number, deviceData: Partial<NetworkDevice>): Promise<NetworkDevice | undefined> {
    const [updatedDevice] = await db
      .update(networkDevices)
      .set(deviceData)
      .where(eq(networkDevices.id, id))
      .returning();
      
    return updatedDevice || undefined;
  }
  
  async deleteNetworkDevice(id: number): Promise<boolean> {
    try {
      // First, delete any connections that use this device
      await db
        .delete(networkConnections)
        .where(
          or(
            eq(networkConnections.sourceDeviceId, id),
            eq(networkConnections.targetDeviceId, id)
          )
        );
      
      // Then delete the device metrics
      await db
        .delete(networkMetrics)
        .where(eq(networkMetrics.deviceId, id));
      
      // Finally delete the device
      const result = await db
        .delete(networkDevices)
        .where(eq(networkDevices.id, id));
        
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting network device:', error);
      return false;
    }
  }
  
  async listNetworkDevices(): Promise<NetworkDevice[]> {
    return db.select().from(networkDevices).orderBy(networkDevices.name);
  }
  
  async updateNetworkDeviceCoordinates(id: number, coordinates: { x: number, y: number }): Promise<NetworkDevice | undefined> {
    const [updatedDevice] = await db
      .update(networkDevices)
      .set({ 
        coordinates: { x: coordinates.x, y: coordinates.y }
      })
      .where(eq(networkDevices.id, id))
      .returning();
      
    return updatedDevice || undefined;
  }
  
  // Network Connections
  async getNetworkConnection(id: number): Promise<NetworkConnection | undefined> {
    const [connection] = await db.select().from(networkConnections).where(eq(networkConnections.id, id));
    return connection || undefined;
  }
  
  async createNetworkConnection(connection: InsertNetworkConnection): Promise<NetworkConnection> {
    const [newConnection] = await db.insert(networkConnections).values(connection).returning();
    return newConnection;
  }
  
  async updateNetworkConnection(id: number, connectionData: Partial<NetworkConnection>): Promise<NetworkConnection | undefined> {
    const [updatedConnection] = await db
      .update(networkConnections)
      .set(connectionData)
      .where(eq(networkConnections.id, id))
      .returning();
      
    return updatedConnection || undefined;
  }
  
  async deleteNetworkConnection(id: number): Promise<boolean> {
    const result = await db
      .delete(networkConnections)
      .where(eq(networkConnections.id, id));
      
    return result.rowCount > 0;
  }
  
  async listNetworkConnections(): Promise<NetworkConnection[]> {
    return db.select().from(networkConnections);
  }
  
  // Network Metrics
  async createNetworkMetric(metric: InsertNetworkMetric): Promise<NetworkMetric> {
    const [newMetric] = await db.insert(networkMetrics).values({
      ...metric,
      timestamp: new Date()
    }).returning();
    
    return newMetric;
  }
  
  async listNetworkMetrics(limit: number): Promise<NetworkMetric[]> {
    return db
      .select()
      .from(networkMetrics)
      .orderBy(desc(networkMetrics.timestamp))
      .limit(limit);
  }
  
  async getNetworkMetricsByDeviceId(deviceId: number, limit: number): Promise<NetworkMetric[]> {
    return db
      .select()
      .from(networkMetrics)
      .where(eq(networkMetrics.deviceId, deviceId))
      .orderBy(desc(networkMetrics.timestamp))
      .limit(limit);
  }

  // IP Network methods (IPAM)
  async getIpNetwork(id: number): Promise<IpNetwork | undefined> {
    const [network] = await db.select().from(ipNetworks).where(eq(ipNetworks.id, id));
    return network || undefined;
  }
  
  async createIpNetwork(network: InsertIpNetwork): Promise<IpNetwork> {
    const [newNetwork] = await db
      .insert(ipNetworks)
      .values(network)
      .returning();
    return newNetwork;
  }
  
  async updateIpNetwork(id: number, network: Partial<IpNetwork>): Promise<IpNetwork | undefined> {
    const [updatedNetwork] = await db
      .update(ipNetworks)
      .set(network)
      .where(eq(ipNetworks.id, id))
      .returning();
    return updatedNetwork || undefined;
  }
  
  async deleteIpNetwork(id: number): Promise<boolean> {
    await db
      .delete(ipNetworks)
      .where(eq(ipNetworks.id, id));
    return true;
  }
  
  async listIpNetworks(): Promise<IpNetwork[]> {
    return await db.select().from(ipNetworks);
  }
  
  // IP Address methods (IPAM)
  async getIpAddress(id: number): Promise<IpAddress | undefined> {
    const [address] = await db.select().from(ipAddresses).where(eq(ipAddresses.id, id));
    return address || undefined;
  }
  
  async createIpAddress(address: InsertIpAddress): Promise<IpAddress> {
    const [newAddress] = await db
      .insert(ipAddresses)
      .values(address)
      .returning();
    return newAddress;
  }
  
  async updateIpAddress(id: number, address: Partial<IpAddress>): Promise<IpAddress | undefined> {
    const [updatedAddress] = await db
      .update(ipAddresses)
      .set(address)
      .where(eq(ipAddresses.id, id))
      .returning();
    return updatedAddress || undefined;
  }
  
  async deleteIpAddress(id: number): Promise<boolean> {
    await db
      .delete(ipAddresses)
      .where(eq(ipAddresses.id, id));
    return true;
  }
  
  async listIpAddresses(): Promise<IpAddress[]> {
    return await db.select().from(ipAddresses);
  }
  
  async getIpAddressesByNetworkId(networkId: number): Promise<IpAddress[]> {
    return await db
      .select()
      .from(ipAddresses)
      .where(eq(ipAddresses.networkId, networkId));
  }

  // 1. AI-Powered Network Optimization Methods
  async getNetworkOptimization(id: number): Promise<NetworkOptimization | undefined> {
    const [optimization] = await db.select().from(networkOptimizations).where(eq(networkOptimizations.id, id));
    return optimization || undefined;
  }

  async createNetworkOptimization(optimization: InsertNetworkOptimization): Promise<NetworkOptimization> {
    const [newOptimization] = await db
      .insert(networkOptimizations)
      .values(optimization)
      .returning();
    return newOptimization;
  }

  async updateNetworkOptimization(id: number, optimization: Partial<NetworkOptimization>): Promise<NetworkOptimization | undefined> {
    const [updatedOptimization] = await db
      .update(networkOptimizations)
      .set(optimization)
      .where(eq(networkOptimizations.id, id))
      .returning();
    return updatedOptimization || undefined;
  }

  async deleteNetworkOptimization(id: number): Promise<boolean> {
    await db
      .delete(networkOptimizations)
      .where(eq(networkOptimizations.id, id));
    return true;
  }

  async listNetworkOptimizations(): Promise<NetworkOptimization[]> {
    return await db.select().from(networkOptimizations);
  }

  // 2. Enhanced Security Suite Methods
  async getSecurityAudit(id: number): Promise<SecurityAudit | undefined> {
    const [audit] = await db.select().from(securityAudits).where(eq(securityAudits.id, id));
    return audit || undefined;
  }

  async createSecurityAudit(audit: InsertSecurityAudit): Promise<SecurityAudit> {
    const [newAudit] = await db
      .insert(securityAudits)
      .values(audit)
      .returning();
    return newAudit;
  }

  async updateSecurityAudit(id: number, audit: Partial<SecurityAudit>): Promise<SecurityAudit | undefined> {
    const [updatedAudit] = await db
      .update(securityAudits)
      .set(audit)
      .where(eq(securityAudits.id, id))
      .returning();
    return updatedAudit || undefined;
  }

  async listSecurityAudits(): Promise<SecurityAudit[]> {
    return await db.select().from(securityAudits);
  }

  async getSecurityThreat(id: number): Promise<SecurityThreat | undefined> {
    const [threat] = await db.select().from(securityThreats).where(eq(securityThreats.id, id));
    return threat || undefined;
  }

  async createSecurityThreat(threat: InsertSecurityThreat): Promise<SecurityThreat> {
    const [newThreat] = await db
      .insert(securityThreats)
      .values(threat)
      .returning();
    return newThreat;
  }

  async updateSecurityThreat(id: number, threat: Partial<SecurityThreat>): Promise<SecurityThreat | undefined> {
    const [updatedThreat] = await db
      .update(securityThreats)
      .set(threat)
      .where(eq(securityThreats.id, id))
      .returning();
    return updatedThreat || undefined;
  }

  async resolveSecurityThreat(id: number): Promise<SecurityThreat | undefined> {
    const [resolvedThreat] = await db
      .update(securityThreats)
      .set({
        status: 'resolved',
        resolvedAt: new Date()
      })
      .where(eq(securityThreats.id, id))
      .returning();
    return resolvedThreat || undefined;
  }

  async listSecurityThreats(): Promise<SecurityThreat[]> {
    return await db.select().from(securityThreats);
  }

  async listActiveSecurityThreats(): Promise<SecurityThreat[]> {
    return await db
      .select()
      .from(securityThreats)
      .where(eq(securityThreats.status, 'active'));
  }

  // 3. Customer Self-Service Portal Methods
  async getCustomerPortalSettings(customerId: number): Promise<CustomerPortalSetting | undefined> {
    const [settings] = await db
      .select()
      .from(customerPortalSettings)
      .where(eq(customerPortalSettings.customerId, customerId));
    return settings || undefined;
  }

  async createCustomerPortalSettings(settings: InsertCustomerPortalSetting): Promise<CustomerPortalSetting> {
    const [newSettings] = await db
      .insert(customerPortalSettings)
      .values({
        ...settings,
        updatedAt: new Date()
      })
      .returning();
    return newSettings;
  }

  async updateCustomerPortalSettings(customerId: number, settingsData: Partial<CustomerPortalSetting>): Promise<CustomerPortalSetting | undefined> {
    const [updatedSettings] = await db
      .update(customerPortalSettings)
      .set({
        ...settingsData,
        updatedAt: new Date()
      })
      .where(eq(customerPortalSettings.customerId, customerId))
      .returning();
    return updatedSettings || undefined;
  }

  async getUsageAlert(id: number): Promise<UsageAlert | undefined> {
    const [alert] = await db.select().from(usageAlerts).where(eq(usageAlerts.id, id));
    return alert || undefined;
  }

  async createUsageAlert(alert: InsertUsageAlert): Promise<UsageAlert> {
    const [newAlert] = await db
      .insert(usageAlerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateUsageAlert(id: number, alert: Partial<UsageAlert>): Promise<UsageAlert | undefined> {
    const [updatedAlert] = await db
      .update(usageAlerts)
      .set(alert)
      .where(eq(usageAlerts.id, id))
      .returning();
    return updatedAlert || undefined;
  }

  async deleteUsageAlert(id: number): Promise<boolean> {
    await db
      .delete(usageAlerts)
      .where(eq(usageAlerts.id, id));
    return true;
  }

  async listUsageAlertsByCustomerId(customerId: number): Promise<UsageAlert[]> {
    return await db
      .select()
      .from(usageAlerts)
      .where(eq(usageAlerts.customerId, customerId));
  }

  // 4. Advanced Revenue Management Methods
  async getRevenueForecast(id: number): Promise<RevenueForecast | undefined> {
    const [forecast] = await db.select().from(revenueForecast).where(eq(revenueForecast.id, id));
    return forecast || undefined;
  }

  async createRevenueForecast(forecast: InsertRevenueForecast): Promise<RevenueForecast> {
    const [newForecast] = await db
      .insert(revenueForecast)
      .values({
        ...forecast,
        updatedAt: new Date()
      })
      .returning();
    return newForecast;
  }

  async updateRevenueForecast(id: number, forecast: Partial<RevenueForecast>): Promise<RevenueForecast | undefined> {
    const [updatedForecast] = await db
      .update(revenueForecast)
      .set({
        ...forecast,
        updatedAt: new Date()
      })
      .where(eq(revenueForecast.id, id))
      .returning();
    return updatedForecast || undefined;
  }

  async listRevenueForecastsByYear(year: number): Promise<RevenueForecast[]> {
    return await db
      .select()
      .from(revenueForecast)
      .where(eq(revenueForecast.year, year));
  }

  async getDynamicPricingRule(id: number): Promise<DynamicPricingRule | undefined> {
    const [rule] = await db.select().from(dynamicPricingRules).where(eq(dynamicPricingRules.id, id));
    return rule || undefined;
  }

  async createDynamicPricingRule(rule: InsertDynamicPricingRule): Promise<DynamicPricingRule> {
    const [newRule] = await db
      .insert(dynamicPricingRules)
      .values({
        ...rule,
        updatedAt: new Date(),
        appliedCount: 0
      })
      .returning();
    return newRule;
  }

  async updateDynamicPricingRule(id: number, rule: Partial<DynamicPricingRule>): Promise<DynamicPricingRule | undefined> {
    const [updatedRule] = await db
      .update(dynamicPricingRules)
      .set({
        ...rule,
        updatedAt: new Date()
      })
      .where(eq(dynamicPricingRules.id, id))
      .returning();
    return updatedRule || undefined;
  }

  async deleteDynamicPricingRule(id: number): Promise<boolean> {
    await db
      .delete(dynamicPricingRules)
      .where(eq(dynamicPricingRules.id, id));
    return true;
  }

  async listDynamicPricingRules(): Promise<DynamicPricingRule[]> {
    return await db.select().from(dynamicPricingRules);
  }

  async listActiveDynamicPricingRules(): Promise<DynamicPricingRule[]> {
    return await db
      .select()
      .from(dynamicPricingRules)
      .where(eq(dynamicPricingRules.isActive, true));
  }

  // 5. Field Service Management Methods
  async getFieldTechnician(id: number): Promise<FieldTechnician | undefined> {
    const [technician] = await db.select().from(fieldTechnicians).where(eq(fieldTechnicians.id, id));
    return technician || undefined;
  }

  async createFieldTechnician(technician: InsertFieldTechnician): Promise<FieldTechnician> {
    const [newTechnician] = await db
      .insert(fieldTechnicians)
      .values({
        ...technician,
        updatedAt: new Date()
      })
      .returning();
    return newTechnician;
  }

  async updateFieldTechnician(id: number, technician: Partial<FieldTechnician>): Promise<FieldTechnician | undefined> {
    const [updatedTechnician] = await db
      .update(fieldTechnicians)
      .set({
        ...technician,
        updatedAt: new Date()
      })
      .where(eq(fieldTechnicians.id, id))
      .returning();
    return updatedTechnician || undefined;
  }

  async listFieldTechnicians(): Promise<FieldTechnician[]> {
    return await db.select().from(fieldTechnicians);
  }

  async listAvailableFieldTechnicians(): Promise<FieldTechnician[]> {
    return await db
      .select()
      .from(fieldTechnicians)
      .where(eq(fieldTechnicians.isAvailable, true));
  }

  async getFieldServiceJob(id: number): Promise<FieldServiceJob | undefined> {
    const [job] = await db.select().from(fieldServiceJobs).where(eq(fieldServiceJobs.id, id));
    return job || undefined;
  }

  async createFieldServiceJob(job: InsertFieldServiceJob): Promise<FieldServiceJob> {
    const [newJob] = await db
      .insert(fieldServiceJobs)
      .values({
        ...job,
        updatedAt: new Date()
      })
      .returning();
    return newJob;
  }

  async updateFieldServiceJob(id: number, job: Partial<FieldServiceJob>): Promise<FieldServiceJob | undefined> {
    const [updatedJob] = await db
      .update(fieldServiceJobs)
      .set({
        ...job,
        updatedAt: new Date()
      })
      .where(eq(fieldServiceJobs.id, id))
      .returning();
    return updatedJob || undefined;
  }

  async assignTechnicianToJob(jobId: number, technicianId: number): Promise<FieldServiceJob | undefined> {
    // Transaction to ensure both the job and technician are updated consistently
    return await db.transaction(async (tx) => {
      // Update the job
      const [updatedJob] = await tx
        .update(fieldServiceJobs)
        .set({
          technicianId,
          status: 'assigned',
          updatedAt: new Date()
        })
        .where(eq(fieldServiceJobs.id, jobId))
        .returning();
      
      if (!updatedJob) return undefined;
      
      // Update the technician availability
      await tx
        .update(fieldTechnicians)
        .set({
          isAvailable: false,
          updatedAt: new Date()
        })
        .where(eq(fieldTechnicians.id, technicianId));
      
      return updatedJob;
    });
  }

  async completeFieldServiceJob(id: number): Promise<FieldServiceJob | undefined> {
    // Transaction to update job and technician status
    return await db.transaction(async (tx) => {
      // Get the job first
      const [job] = await tx
        .select()
        .from(fieldServiceJobs)
        .where(eq(fieldServiceJobs.id, id));
      
      if (!job) return undefined;
      
      // Update the job
      const [completedJob] = await tx
        .update(fieldServiceJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(fieldServiceJobs.id, id))
        .returning();
      
      // If a technician was assigned, mark them as available again
      if (job.technicianId) {
        await tx
          .update(fieldTechnicians)
          .set({
            isAvailable: true,
            updatedAt: new Date()
          })
          .where(eq(fieldTechnicians.id, job.technicianId));
      }
      
      return completedJob;
    });
  }

  async listFieldServiceJobs(): Promise<FieldServiceJob[]> {
    return await db.select().from(fieldServiceJobs);
  }

  async listFieldServiceJobsByStatus(status: string): Promise<FieldServiceJob[]> {
    return await db
      .select()
      .from(fieldServiceJobs)
      .where(eq(fieldServiceJobs.status, status));
  }

  async listFieldServiceJobsByCustomerId(customerId: number): Promise<FieldServiceJob[]> {
    return await db
      .select()
      .from(fieldServiceJobs)
      .where(eq(fieldServiceJobs.customerId, customerId));
  }

  // 6. Network Performance Visualization Methods
  async getNetworkVisualization(id: number): Promise<NetworkVisualization | undefined> {
    const [visualization] = await db.select().from(networkVisualizations).where(eq(networkVisualizations.id, id));
    return visualization || undefined;
  }

  async createNetworkVisualization(visualization: InsertNetworkVisualization): Promise<NetworkVisualization> {
    const [newVisualization] = await db
      .insert(networkVisualizations)
      .values({
        ...visualization,
        updatedAt: new Date(),
        lastAccessedAt: new Date()
      })
      .returning();
    return newVisualization;
  }

  async updateNetworkVisualization(id: number, visualization: Partial<NetworkVisualization>): Promise<NetworkVisualization | undefined> {
    const [updatedVisualization] = await db
      .update(networkVisualizations)
      .set({
        ...visualization,
        updatedAt: new Date()
      })
      .where(eq(networkVisualizations.id, id))
      .returning();
    return updatedVisualization || undefined;
  }

  async deleteNetworkVisualization(id: number): Promise<boolean> {
    await db
      .delete(networkVisualizations)
      .where(eq(networkVisualizations.id, id));
    return true;
  }

  async listNetworkVisualizations(): Promise<NetworkVisualization[]> {
    return await db.select().from(networkVisualizations);
  }

  async getCustomDashboard(id: number): Promise<CustomDashboard | undefined> {
    const [dashboard] = await db.select().from(customDashboards).where(eq(customDashboards.id, id));
    return dashboard || undefined;
  }

  async createCustomDashboard(dashboard: InsertCustomDashboard): Promise<CustomDashboard> {
    const [newDashboard] = await db
      .insert(customDashboards)
      .values({
        ...dashboard,
        updatedAt: new Date()
      })
      .returning();
    return newDashboard;
  }

  async updateCustomDashboard(id: number, dashboard: Partial<CustomDashboard>): Promise<CustomDashboard | undefined> {
    const [updatedDashboard] = await db
      .update(customDashboards)
      .set({
        ...dashboard,
        updatedAt: new Date()
      })
      .where(eq(customDashboards.id, id))
      .returning();
    return updatedDashboard || undefined;
  }

  async deleteCustomDashboard(id: number): Promise<boolean> {
    await db
      .delete(customDashboards)
      .where(eq(customDashboards.id, id));
    return true;
  }

  async listCustomDashboards(): Promise<CustomDashboard[]> {
    return await db.select().from(customDashboards);
  }

  async listCustomDashboardsByOwnerId(ownerId: number): Promise<CustomDashboard[]> {
    return await db
      .select()
      .from(customDashboards)
      .where(eq(customDashboards.ownerId, ownerId));
  }

  // 7. Multi-Service Integration Methods
  async getServiceIntegration(id: number): Promise<ServiceIntegration | undefined> {
    const [integration] = await db.select().from(serviceIntegrations).where(eq(serviceIntegrations.id, id));
    return integration || undefined;
  }

  async createServiceIntegration(integration: InsertServiceIntegration): Promise<ServiceIntegration> {
    const [newIntegration] = await db
      .insert(serviceIntegrations)
      .values({
        ...integration,
        updatedAt: new Date()
      })
      .returning();
    return newIntegration;
  }

  async updateServiceIntegration(id: number, integration: Partial<ServiceIntegration>): Promise<ServiceIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(serviceIntegrations)
      .set({
        ...integration,
        updatedAt: new Date()
      })
      .where(eq(serviceIntegrations.id, id))
      .returning();
    return updatedIntegration || undefined;
  }

  async deleteServiceIntegration(id: number): Promise<boolean> {
    await db
      .delete(serviceIntegrations)
      .where(eq(serviceIntegrations.id, id));
    return true;
  }

  async listServiceIntegrations(): Promise<ServiceIntegration[]> {
    return await db.select().from(serviceIntegrations);
  }

  async getServiceBundle(id: number): Promise<ServiceBundle | undefined> {
    const [bundle] = await db.select().from(serviceBundles).where(eq(serviceBundles.id, id));
    return bundle || undefined;
  }

  async createServiceBundle(bundle: InsertServiceBundle): Promise<ServiceBundle> {
    const [newBundle] = await db
      .insert(serviceBundles)
      .values({
        ...bundle,
        updatedAt: new Date()
      })
      .returning();
    return newBundle;
  }

  async updateServiceBundle(id: number, bundle: Partial<ServiceBundle>): Promise<ServiceBundle | undefined> {
    const [updatedBundle] = await db
      .update(serviceBundles)
      .set({
        ...bundle,
        updatedAt: new Date()
      })
      .where(eq(serviceBundles.id, id))
      .returning();
    return updatedBundle || undefined;
  }

  async deleteServiceBundle(id: number): Promise<boolean> {
    await db
      .delete(serviceBundles)
      .where(eq(serviceBundles.id, id));
    return true;
  }

  async listServiceBundles(): Promise<ServiceBundle[]> {
    return await db.select().from(serviceBundles);
  }

  async listActiveServiceBundles(): Promise<ServiceBundle[]> {
    return await db
      .select()
      .from(serviceBundles)
      .where(eq(serviceBundles.isActive, true));
  }
}

// Use the database storage
export const storage = new DatabaseStorage();
