import { pgTable, text, serial, integer, boolean, timestamp, real, doublePrecision, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for authentication and role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("support"), // admin, support, billing
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Customer model for ISP clients
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  status: text("status").notNull().default("active"), // active, suspended, terminated
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Plan model for different bandwidth plans
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  downloadSpeed: integer("download_speed").notNull(), // in Mbps
  uploadSpeed: integer("upload_speed").notNull(), // in Mbps
  dataLimit: integer("data_limit"), // in GB, null means unlimited
  price: real("price").notNull(), // monthly price
});

export const insertPlanSchema = createInsertSchema(plans).omit({ 
  id: true 
});

// Subscription model linking customers to plans
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  planId: integer("plan_id").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"), // active, expired, cancelled
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true
});

// Usage tracking model
export const usages = pgTable("usages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  downloadUsage: doublePrecision("download_usage").notNull(), // in GB
  uploadUsage: doublePrecision("upload_usage").notNull(), // in GB
  date: timestamp("date").notNull().defaultNow(),
});

export const insertUsageSchema = createInsertSchema(usages).omit({
  id: true
});

// Billing model
export const billings = pgTable("billings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBillingSchema = createInsertSchema(billings).omit({
  id: true,
  createdAt: true
});

// Ticket model for customer support
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  assignedToUserId: integer("assigned_to_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  closedAt: timestamp("closed_at"),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true
});

// Ticket comments
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id"),
  customerId: integer("customer_id"),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true
});

// RADIUS server clients configuration
export const radiusClients = pgTable("radius_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull().unique(),
  secret: text("secret").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
});

export const insertRadiusClientSchema = createInsertSchema(radiusClients).omit({
  id: true
});

// RADIUS authentication records
export const radiusAuth = pgTable("radius_auth", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  clientIpAddress: text("client_ip_address").notNull(),
  status: text("status").notNull(), // accept, reject
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertRadiusAuthSchema = createInsertSchema(radiusAuth).omit({
  id: true,
  timestamp: true
});

// Activity logs for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  customerId: integer("customer_id"),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true
});

// Network Devices and Topology Tables
export const networkDevices = pgTable("network_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  deviceType: text("device_type").notNull(), // router, switch, access_point, etc.
  model: text("model"),
  manufacturer: text("manufacturer"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  status: text("status").notNull().default("active"), // active, inactive, maintenance
  location: text("location"),
  coordinates: json("coordinates").default({}), // Store x, y positions for topology view
  createdAt: timestamp("created_at").defaultNow(),
  lastSeen: timestamp("last_seen"),
  firmwareVersion: text("firmware_version"),
  description: text("description"),
  snmpEnabled: boolean("snmp_enabled").default(false),
  snmpCommunity: text("snmp_community"),
  icon: text("icon"), // Icon identifier for UI representation
});

export const insertNetworkDeviceSchema = createInsertSchema(networkDevices).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
  coordinates: true,
});

export const networkConnections = pgTable("network_connections", {
  id: serial("id").primaryKey(),
  sourceDeviceId: integer("source_device_id").notNull().references(() => networkDevices.id, { onDelete: "cascade" }),
  targetDeviceId: integer("target_device_id").notNull().references(() => networkDevices.id, { onDelete: "cascade" }),
  connectionType: text("connection_type").notNull(), // fiber, ethernet, wireless, etc.
  bandwidth: integer("bandwidth"), // Mbps
  status: text("status").notNull().default("active"), // active, down, degraded
  latency: integer("latency"), // ms
  packetLoss: real("packet_loss"), // percentage
  lastUpdated: timestamp("last_updated").defaultNow(),
  metrics: json("metrics").default({}), // Store historical metrics data
});

export const insertNetworkConnectionSchema = createInsertSchema(networkConnections).omit({
  id: true,
  lastUpdated: true,
  metrics: true,
});

export const networkMetrics = pgTable("network_metrics", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").notNull().references(() => networkDevices.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").defaultNow(),
  cpuUsage: real("cpu_usage"), // percentage
  memoryUsage: real("memory_usage"), // percentage
  temperature: real("temperature"), // celsius
  bandwidth: real("bandwidth"), // current bandwidth usage in Mbps
  uptimeSeconds: integer("uptime_seconds"),
  metrics: json("metrics").default({}), // Store additional metrics
});

export const insertNetworkMetricSchema = createInsertSchema(networkMetrics).omit({
  id: true,
  timestamp: true,
  metrics: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Usage = typeof usages.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;

export type Billing = typeof billings.$inferSelect;
export type InsertBilling = z.infer<typeof insertBillingSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = z.infer<typeof insertTicketCommentSchema>;

export type RadiusClient = typeof radiusClients.$inferSelect;
export type InsertRadiusClient = z.infer<typeof insertRadiusClientSchema>;

export type RadiusAuth = typeof radiusAuth.$inferSelect;
export type InsertRadiusAuth = z.infer<typeof insertRadiusAuthSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Network monitoring and topology types
export type NetworkDevice = typeof networkDevices.$inferSelect;
export type InsertNetworkDevice = z.infer<typeof insertNetworkDeviceSchema>;

export type NetworkConnection = typeof networkConnections.$inferSelect;
export type InsertNetworkConnection = z.infer<typeof insertNetworkConnectionSchema>;

export type NetworkMetric = typeof networkMetrics.$inferSelect;
export type InsertNetworkMetric = z.infer<typeof insertNetworkMetricSchema>;

// IPAM Models
export const ipNetworks = pgTable("ip_networks", {
  id: serial("id").primaryKey(),
  networkAddress: text("network_address").notNull(),
  subnetMask: text("subnet_mask").notNull(),
  vlanId: integer("vlan_id"),
  description: text("description"),
  location: text("location"),
  assignedTo: text("assigned_to"),
  category: text("category").notNull().default("infrastructure"), // customer, infrastructure, management, transit, other
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertIpNetworkSchema = createInsertSchema(ipNetworks).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const ipAddresses = pgTable("ip_addresses", {
  id: serial("id").primaryKey(),
  networkId: integer("network_id").notNull().references(() => ipNetworks.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  hostname: text("hostname"),
  macAddress: text("mac_address"),
  status: text("status").notNull().default("available"), // available, reserved, assigned, dhcp
  assignedTo: text("assigned_to"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertIpAddressSchema = createInsertSchema(ipAddresses).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

// PBX Tenants
export const pbxTenants = pgTable("pbx_tenants", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  active: boolean("active").default(true),
  maxExtensions: integer("max_extensions").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxTenantSchema = createInsertSchema(pbxTenants).omit({
  id: true,
  createdAt: true,
});

// PBX Extensions
export const pbxExtensions = pgTable("pbx_extensions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  extensionNumber: text("extension_number").notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  active: boolean("active").default(true),
  voicemailEnabled: boolean("voicemail_enabled").default(true),
  voicemailPin: text("voicemail_pin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxExtensionSchema = createInsertSchema(pbxExtensions).omit({
  id: true,
  createdAt: true,
});

// PBX Call Routes
export const pbxCallRoutes = pgTable("pbx_call_routes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pattern: text("pattern").notNull(),
  destination: text("destination").notNull(), // Extension, IVR, Ring Group, etc.
  destinationType: text("destination_type").notNull(), // "extension", "ivr", "ring_group", "external"
  priority: integer("priority").default(1),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxCallRouteSchema = createInsertSchema(pbxCallRoutes).omit({
  id: true,
  createdAt: true,
});

// PBX Ring Groups
export const pbxRingGroups = pgTable("pbx_ring_groups", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  strategy: text("strategy").notNull(), // "simultaneous", "sequential", "random"
  timeout: integer("timeout").default(20), // seconds
  fallbackDestination: text("fallback_destination"),
  fallbackDestinationType: text("fallback_destination_type"), // "extension", "voicemail", "external"
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxRingGroupSchema = createInsertSchema(pbxRingGroups).omit({
  id: true,
  createdAt: true,
});

// PBX Ring Group Members
export const pbxRingGroupMembers = pgTable("pbx_ring_group_members", {
  id: serial("id").primaryKey(),
  ringGroupId: integer("ring_group_id").notNull().references(() => pbxRingGroups.id, { onDelete: "cascade" }),
  extensionId: integer("extension_id").notNull().references(() => pbxExtensions.id, { onDelete: "cascade" }),
  priority: integer("priority").default(1), // For sequential strategy
  timeout: integer("timeout").default(15), // seconds
  active: boolean("active").default(true),
});

export const insertPbxRingGroupMemberSchema = createInsertSchema(pbxRingGroupMembers).omit({
  id: true,
});

// PBX IVR Menus
export const pbxIvrMenus = pgTable("pbx_ivr_menus", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  greeting: text("greeting").notNull(), // Path to audio file or text-to-speech content
  timeout: integer("timeout").default(10), // seconds
  maxAttempts: integer("max_attempts").default(3),
  exitDestination: text("exit_destination"),
  exitDestinationType: text("exit_destination_type"), // "extension", "voicemail", "hang-up"
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxIvrMenuSchema = createInsertSchema(pbxIvrMenus).omit({
  id: true,
  createdAt: true,
});

// PBX IVR Menu Options
export const pbxIvrMenuOptions = pgTable("pbx_ivr_menu_options", {
  id: serial("id").primaryKey(),
  ivrMenuId: integer("ivr_menu_id").notNull().references(() => pbxIvrMenus.id, { onDelete: "cascade" }),
  digit: text("digit").notNull(), // 0-9, *, #
  destination: text("destination").notNull(),
  destinationType: text("destination_type").notNull(), // "extension", "ivr", "ring_group", "voicemail"
  active: boolean("active").default(true),
});

export const insertPbxIvrMenuOptionSchema = createInsertSchema(pbxIvrMenuOptions).omit({
  id: true,
});

// PBX Call Logs
export const pbxCallLogs = pgTable("pbx_call_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  callerId: text("caller_id"),
  destination: text("destination"),
  direction: text("direction").notNull(), // "inbound", "outbound", "internal"
  duration: integer("duration"), // seconds
  status: text("status").notNull(), // "answered", "no-answer", "busy", "failed"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  recordingPath: text("recording_path"),
});

export const insertPbxCallLogSchema = createInsertSchema(pbxCallLogs).omit({
  id: true,
});

// Type exports for PBX models
export type PbxTenant = typeof pbxTenants.$inferSelect;
export type InsertPbxTenant = z.infer<typeof insertPbxTenantSchema>;

export type PbxExtension = typeof pbxExtensions.$inferSelect;
export type InsertPbxExtension = z.infer<typeof insertPbxExtensionSchema>;

export type PbxCallRoute = typeof pbxCallRoutes.$inferSelect;
export type InsertPbxCallRoute = z.infer<typeof insertPbxCallRouteSchema>;

export type PbxRingGroup = typeof pbxRingGroups.$inferSelect;
export type InsertPbxRingGroup = z.infer<typeof insertPbxRingGroupSchema>;

export type PbxRingGroupMember = typeof pbxRingGroupMembers.$inferSelect;
export type InsertPbxRingGroupMember = z.infer<typeof insertPbxRingGroupMemberSchema>;

export type PbxIvrMenu = typeof pbxIvrMenus.$inferSelect;
export type InsertPbxIvrMenu = z.infer<typeof insertPbxIvrMenuSchema>;

export type PbxIvrMenuOption = typeof pbxIvrMenuOptions.$inferSelect;
export type InsertPbxIvrMenuOption = z.infer<typeof insertPbxIvrMenuOptionSchema>;

export type PbxCallLog = typeof pbxCallLogs.$inferSelect;
export type InsertPbxCallLog = z.infer<typeof insertPbxCallLogSchema>;

// PBX Gateways
export const pbxGateways = pgTable("pbx_gateways", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").default(5060),
  username: text("username"),
  password: text("password"),
  transportType: text("transport_type").default("udp"), // udp, tcp, tls
  registerEnabled: boolean("register_enabled").default(false),
  active: boolean("active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxGatewaySchema = createInsertSchema(pbxGateways).omit({
  id: true,
  createdAt: true,
});

// PBX Gateway Routes
export const pbxGatewayRoutes = pgTable("pbx_gateway_routes", {
  id: serial("id").primaryKey(),
  gatewayId: integer("gateway_id").notNull().references(() => pbxGateways.id, { onDelete: "cascade" }),
  prefix: text("prefix").notNull(),
  priority: integer("priority").default(1),
  prepend: text("prepend"),
  stripDigits: integer("strip_digits").default(0),
  active: boolean("active").default(true),
});

export const insertPbxGatewayRouteSchema = createInsertSchema(pbxGatewayRoutes).omit({
  id: true,
});

// PBX Call Flow
export const pbxCallFlows = pgTable("pbx_call_flows", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => pbxTenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  flowData: json("flow_data").notNull(), // Stores the visual flow builder JSON
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPbxCallFlowSchema = createInsertSchema(pbxCallFlows).omit({
  id: true,
  createdAt: true,
});

// Type exports for PBX Gateway and Call Flow models
export type PbxGateway = typeof pbxGateways.$inferSelect;
export type InsertPbxGateway = z.infer<typeof insertPbxGatewaySchema>;

export type PbxGatewayRoute = typeof pbxGatewayRoutes.$inferSelect;
export type InsertPbxGatewayRoute = z.infer<typeof insertPbxGatewayRouteSchema>;

export type PbxCallFlow = typeof pbxCallFlows.$inferSelect;
export type InsertPbxCallFlow = z.infer<typeof insertPbxCallFlowSchema>;

// IPAM type exports
export type IpNetwork = typeof ipNetworks.$inferSelect;
export type InsertIpNetwork = z.infer<typeof insertIpNetworkSchema>;

export type IpAddress = typeof ipAddresses.$inferSelect;
export type InsertIpAddress = z.infer<typeof insertIpAddressSchema>;
