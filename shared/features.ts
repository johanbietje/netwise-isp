// Defines the feature types and interfaces for the enhanced Netwise ISP management system

import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, integer, timestamp, jsonb, boolean, date } from "drizzle-orm/pg-core";

// 1. AI-Powered Network Optimization
export const networkOptimizations = pgTable("network_optimizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  lastRunAt: timestamp("last_run_at"),
  settings: jsonb("settings"),
  resultsData: jsonb("results_data"),
  scheduledFor: timestamp("scheduled_for"),
  optimizationType: text("optimization_type").notNull() // bandwidth, qos, routing, etc.
});

export const insertNetworkOptimizationSchema = createInsertSchema(networkOptimizations).omit({
  id: true,
  createdAt: true
});

// 2. Enhanced Security Suite
export const securityAudits = pgTable("security_audits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  findings: jsonb("findings"), // Security findings and results
  severity: text("severity"),
  networkId: integer("network_id"),
  customerId: integer("customer_id"),
  recommendations: jsonb("recommendations")
});

export const insertSecurityAuditSchema = createInsertSchema(securityAudits).omit({
  id: true,
  createdAt: true
});

export const securityThreats = pgTable("security_threats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  severity: text("severity").notNull(),
  sourceIp: text("source_ip"),
  destinationIp: text("destination_ip"),
  customerId: integer("customer_id"),
  threatType: text("threat_type").notNull(),
  mitigationSteps: jsonb("mitigation_steps"),
  status: text("status").default("active")
});

export const insertSecurityThreatSchema = createInsertSchema(securityThreats).omit({
  id: true,
  detectedAt: true
});

// 3. Customer Self-Service Portal
export const customerPortalSettings = pgTable("customer_portal_settings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().unique(),
  dashboardLayout: jsonb("dashboard_layout"),
  notificationPreferences: jsonb("notification_preferences"),
  uiPreferences: jsonb("ui_preferences"),
  accessControls: jsonb("access_controls"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertCustomerPortalSettingsSchema = createInsertSchema(customerPortalSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const usageAlerts = pgTable("usage_alerts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  name: text("name").notNull(),
  threshold: integer("threshold").notNull(), // Percentage of usage limit
  alertType: text("alert_type").notNull(), // SMS, email, push
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastTriggeredAt: timestamp("last_triggered_at")
});

export const insertUsageAlertSchema = createInsertSchema(usageAlerts).omit({
  id: true,
  createdAt: true,
  lastTriggeredAt: true
});

// 4. Advanced Revenue Management
export const revenueForecast = pgTable("revenue_forecast", {
  id: serial("id").primaryKey(),
  month: date("month").notNull(),
  year: integer("year").notNull(),
  predictedRevenue: integer("predicted_revenue").notNull(),
  actualRevenue: integer("actual_revenue"),
  confidenceLevel: integer("confidence_level"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  forecastFactors: jsonb("forecast_factors") // Factors that influenced the forecast
});

export const insertRevenueForecastSchema = createInsertSchema(revenueForecast).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const dynamicPricingRules = pgTable("dynamic_pricing_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  conditions: jsonb("conditions").notNull(), // JSON with conditions for the rule
  adjustmentType: text("adjustment_type").notNull(), // percentage, fixed_amount
  adjustmentValue: integer("adjustment_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  appliedCount: integer("applied_count").default(0)
});

export const insertDynamicPricingRuleSchema = createInsertSchema(dynamicPricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  appliedCount: true
});

// 5. Field Service Management
export const fieldTechnicians = pgTable("field_technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  specializations: jsonb("specializations"),
  skills: jsonb("skills"),
  availability: jsonb("availability"),
  currentLocation: jsonb("current_location"), // latitude, longitude
  isAvailable: boolean("is_available").default(true),
  vehicleId: text("vehicle_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertFieldTechnicianSchema = createInsertSchema(fieldTechnicians).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const fieldServiceJobs = pgTable("field_service_jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  customerId: integer("customer_id").notNull(),
  technicianId: integer("technician_id"),
  status: text("status").default("pending"),
  priority: text("priority").default("medium"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  locationData: jsonb("location_data"),
  requiredSkills: jsonb("required_skills"),
  requiredEquipment: jsonb("required_equipment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  estimatedDuration: integer("estimated_duration") // in minutes
});

export const insertFieldServiceJobSchema = createInsertSchema(fieldServiceJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true
});

// 6. Network Performance Visualization
export const networkVisualizations = pgTable("network_visualizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  visualizationType: text("visualization_type").notNull(), // 3d_map, heatmap, etc.
  settings: jsonb("settings"),
  isPublic: boolean("is_public").default(false),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  lastAccessedAt: timestamp("last_accessed_at")
});

export const insertNetworkVisualizationSchema = createInsertSchema(networkVisualizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastAccessedAt: true
});

export const customDashboards = pgTable("custom_dashboards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull(),
  isPublic: boolean("is_public").default(false),
  layout: jsonb("layout").notNull(),
  widgets: jsonb("widgets").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  category: text("category").default("general") // performance, security, revenue, etc.
});

export const insertCustomDashboardSchema = createInsertSchema(customDashboards).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// 7. Multi-Service Integration
export const serviceIntegrations = pgTable("service_integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(), // voice, internet, tv, etc.
  provider: text("provider"),
  apiCredentials: jsonb("api_credentials"),
  integrationStatus: text("integration_status").default("configuring"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  lastSyncAt: timestamp("last_sync_at")
});

export const insertServiceIntegrationSchema = createInsertSchema(serviceIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true
});

export const serviceBundles = pgTable("service_bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  includesInternet: boolean("includes_internet").default(true),
  includesVoice: boolean("includes_voice").default(false),
  includesValueAdded: boolean("includes_value_added").default(false),
  price: integer("price").notNull(),
  discount: integer("discount").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  bundleComponents: jsonb("bundle_components") // Details of what's included
});

export const insertServiceBundleSchema = createInsertSchema(serviceBundles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type definitions for exported table types
export type NetworkOptimization = typeof networkOptimizations.$inferSelect;
export type InsertNetworkOptimization = z.infer<typeof insertNetworkOptimizationSchema>;

export type SecurityAudit = typeof securityAudits.$inferSelect;
export type InsertSecurityAudit = z.infer<typeof insertSecurityAuditSchema>;

export type SecurityThreat = typeof securityThreats.$inferSelect;
export type InsertSecurityThreat = z.infer<typeof insertSecurityThreatSchema>;

export type CustomerPortalSetting = typeof customerPortalSettings.$inferSelect;
export type InsertCustomerPortalSetting = z.infer<typeof insertCustomerPortalSettingsSchema>;

export type UsageAlert = typeof usageAlerts.$inferSelect;
export type InsertUsageAlert = z.infer<typeof insertUsageAlertSchema>;

export type RevenueForecast = typeof revenueForecast.$inferSelect;
export type InsertRevenueForecast = z.infer<typeof insertRevenueForecastSchema>;

export type DynamicPricingRule = typeof dynamicPricingRules.$inferSelect;
export type InsertDynamicPricingRule = z.infer<typeof insertDynamicPricingRuleSchema>;

export type FieldTechnician = typeof fieldTechnicians.$inferSelect;
export type InsertFieldTechnician = z.infer<typeof insertFieldTechnicianSchema>;

export type FieldServiceJob = typeof fieldServiceJobs.$inferSelect;
export type InsertFieldServiceJob = z.infer<typeof insertFieldServiceJobSchema>;

export type NetworkVisualization = typeof networkVisualizations.$inferSelect;
export type InsertNetworkVisualization = z.infer<typeof insertNetworkVisualizationSchema>;

export type CustomDashboard = typeof customDashboards.$inferSelect;
export type InsertCustomDashboard = z.infer<typeof insertCustomDashboardSchema>;

export type ServiceIntegration = typeof serviceIntegrations.$inferSelect;
export type InsertServiceIntegration = z.infer<typeof insertServiceIntegrationSchema>;

export type ServiceBundle = typeof serviceBundles.$inferSelect;
export type InsertServiceBundle = z.infer<typeof insertServiceBundleSchema>;