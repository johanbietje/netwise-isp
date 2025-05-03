import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { radiusService } from "./radius";
import { pbxService } from "./pbx";
import { authenticate, authorize, login, authenticateCustomer, customerLogin } from "./auth";
import { RadiusRequest } from "@shared/types";
import { db } from "./db";
import { and, asc, count, desc, eq, gt, gte, lte, sql, sum } from "drizzle-orm";
import { 
  activityLogs,
  billings,
  customers,
  plans,
  radiusAuth,
  subscriptions,
  tickets,
  usages,
  insertUserSchema, 
  insertCustomerSchema, 
  insertPlanSchema, 
  insertTicketSchema, 
  insertTicketCommentSchema, 
  insertRadiusClientSchema,
  insertNetworkDeviceSchema,
  insertNetworkConnectionSchema,
  insertNetworkMetricSchema,
  insertPbxTenantSchema,
  insertPbxExtensionSchema,
  insertPbxCallRouteSchema,
  insertPbxRingGroupSchema,
  insertPbxRingGroupMemberSchema,
  insertPbxIvrMenuSchema,
  insertPbxIvrMenuOptionSchema,
  insertPbxCallLogSchema,
  insertPbxGatewaySchema,
  insertPbxGatewayRouteSchema,
  insertPbxCallFlowSchema,
  insertIpNetworkSchema,
  insertIpAddressSchema
} from "@shared/schema";

// Import advanced features schemas
import {
  insertNetworkOptimizationSchema,
  insertSecurityAuditSchema,
  insertSecurityThreatSchema,
  insertCustomerPortalSettingsSchema,
  insertUsageAlertSchema,
  insertRevenueForecastSchema,
  insertDynamicPricingRuleSchema,
  insertFieldTechnicianSchema,
  insertFieldServiceJobSchema,
  insertNetworkVisualizationSchema,
  insertCustomDashboardSchema,
  insertServiceIntegrationSchema,
  insertServiceBundleSchema
} from "@shared/features";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // HTTP server for normal web traffic
  const httpServer = createServer(app);
  
  // Authentication routes
  app.post('/api/auth/login', login);
  
  // Current user
  app.get('/api/auth/me', authenticate, async (req, res) => {
    const user = (req as any).user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    });
  });
  
  // RADIUS authentication endpoint
  app.post('/api/radius/auth', async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
        clientIpAddress: z.string(),
        nasIdentifier: z.string().optional(),
        callingStationId: z.string().optional()
      });
      
      const validatedData = schema.parse(req.body);
      const response = await radiusService.authenticate(validatedData as RadiusRequest);
      
      res.json(response);
    } catch (error) {
      console.error('RADIUS auth error:', error);
      res.status(400).json({ 
        status: 'reject',
        message: 'Invalid request format'
      });
    }
  });
  
  // RADIUS accounting endpoint
  app.post('/api/radius/acct', async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        acctType: z.string(),
        sessionTime: z.number(),
        inputOctets: z.number(),
        outputOctets: z.number()
      });
      
      const validatedData = schema.parse(req.body);
      const success = await radiusService.accounting(
        validatedData.username,
        validatedData.acctType,
        validatedData.sessionTime,
        validatedData.inputOctets,
        validatedData.outputOctets
      );
      
      if (success) {
        res.json({ status: 'success' });
      } else {
        res.status(400).json({ status: 'error', message: 'Accounting failed' });
      }
    } catch (error) {
      console.error('RADIUS accounting error:', error);
      res.status(400).json({ status: 'error', message: 'Invalid request format' });
    }
  });
  
  // Dashboard stats
  app.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Bandwidth usage over time
  app.get('/api/dashboard/bandwidth', authenticate, async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const data = await storage.getBandwidthUsageOverTime(days);
      res.json(data);
    } catch (error) {
      console.error('Error getting bandwidth usage:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Top customers by usage
  app.get('/api/dashboard/top-customers', authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const data = await storage.getTopCustomersByUsage(limit, startOfMonth, endOfMonth);
      res.json(data);
    } catch (error) {
      console.error('Error getting top customers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Recent activity
  app.get('/api/dashboard/activity', authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const data = await storage.listRecentActivityLogs(limit);
      res.json(data);
    } catch (error) {
      console.error('Error getting recent activity:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Customer routes
  app.get('/api/customers', authenticate, async (req, res) => {
    try {
      const data = await storage.listCustomers();
      res.json(data);
    } catch (error) {
      console.error('Error listing customers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/customers/search', authenticate, async (req, res) => {
    try {
      const term = req.query.term as string || '';
      const data = await storage.searchCustomers(term);
      res.json(data);
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/customers/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(customer);
    } catch (error) {
      console.error('Error getting customer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/customers', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Customer Created',
        details: `Created customer ${customer.username}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/customers/:id', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertCustomerSchema.partial().parse(req.body);
      
      const customer = await storage.updateCustomer(id, data);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Customer Updated',
        details: `Updated customer ${customer.username}`,
        ipAddress: req.ip
      });
      
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/customers/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      const success = await storage.deleteCustomer(id);
      
      if (success) {
        // Log the activity
        await storage.createActivityLog({
          userId: (req as any).user.id,
          action: 'Customer Deleted',
          details: `Deleted customer ${customer.username}`,
          ipAddress: req.ip
        });
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete customer' });
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Plan routes
  app.get('/api/plans', authenticate, async (req, res) => {
    try {
      const data = await storage.listPlans();
      res.json(data);
    } catch (error) {
      console.error('Error listing plans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/plans/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error getting plan:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/plans', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPlanSchema.parse(req.body);
      const plan = await storage.createPlan(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Plan Created',
        details: `Created plan ${plan.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(plan);
    } catch (error) {
      console.error('Error creating plan:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/plans/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPlanSchema.partial().parse(req.body);
      
      const plan = await storage.updatePlan(id, data);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Plan Updated',
        details: `Updated plan ${plan.name}`,
        ipAddress: req.ip
      });
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/plans/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPlanSchema.partial().parse(req.body);
      
      const plan = await storage.updatePlan(id, data);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Plan Updated',
        details: `Updated plan ${plan.name}`,
        ipAddress: req.ip
      });
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.delete('/api/plans/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.getPlan(id);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      const success = await storage.deletePlan(id);
      
      if (success) {
        // Log the activity
        await storage.createActivityLog({
          userId: (req as any).user.id,
          action: 'Plan Deleted',
          details: `Deleted plan ${plan.name}`,
          ipAddress: req.ip
        });
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete plan' });
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Subscription routes
  app.get('/api/subscriptions', authenticate, async (req, res) => {
    try {
      const data = await storage.listSubscriptions();
      res.json(data);
    } catch (error) {
      console.error('Error listing subscriptions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/customers/:id/subscription', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const subscription = await storage.getSubscriptionByCustomerId(customerId);
      
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      // Get the plan details
      const plan = await storage.getPlan(subscription.planId);
      
      res.json({
        ...subscription,
        plan
      });
    } catch (error) {
      console.error('Error getting customer subscription:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Usage routes
  app.get('/api/customers/:id/usage', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      // Check if date range is provided
      let startDate = new Date();
      let endDate = new Date();
      
      if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate as string);
        endDate = new Date(req.query.endDate as string);
        
        const usages = await storage.getCustomerUsageByDateRange(customerId, startDate, endDate);
        res.json(usages);
      } else {
        // Get all usage
        const usages = await storage.getCustomerUsage(customerId);
        res.json(usages);
      }
    } catch (error) {
      console.error('Error getting customer usage:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Billing routes
  app.get('/api/billings', authenticate, authorize(['admin', 'billing']), async (req, res) => {
    try {
      const pending = req.query.pending === 'true';
      
      if (pending) {
        const billings = await storage.listPendingBillings();
        res.json(billings);
      } else {
        // In a real implementation, we would get all billings with pagination
        res.status(400).json({ message: 'Please specify filters for billing list' });
      }
    } catch (error) {
      console.error('Error listing billings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/customers/:id/billings', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const billings = await storage.listBillingsByCustomerId(customerId);
      res.json(billings);
    } catch (error) {
      console.error('Error getting customer billings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Ticket routes
  app.get('/api/tickets', authenticate, async (req, res) => {
    try {
      const open = req.query.open === 'true';
      const type = req.query.type as string | undefined;
      
      let tickets;
      
      if (open) {
        tickets = await storage.listOpenTickets();
      } else {
        tickets = await storage.listTickets();
      }
      
      // Filter by type if specified (e.g., 'radius' for RADIUS-related tickets)
      if (type) {
        tickets = tickets.filter(ticket => 
          ticket.subject.toLowerCase().includes(type.toLowerCase()) || 
          ticket.description.toLowerCase().includes(type.toLowerCase())
        );
      }
      
      res.json(tickets);
    } catch (error) {
      console.error('Error listing tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/customers/:id/tickets', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const tickets = await storage.listTicketsByCustomerId(customerId);
      res.json(tickets);
    } catch (error) {
      console.error('Error getting customer tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/tickets/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ticket = await storage.getTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Get comments
      const comments = await storage.listTicketCommentsByTicketId(id);
      
      res.json({
        ...ticket,
        comments
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/tickets', authenticate, async (req, res) => {
    try {
      const data = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        customerId: data.customerId,
        action: 'Ticket Created',
        details: `Created ticket: ${ticket.subject}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/tickets/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTicketSchema.partial().parse(req.body);
      
      const ticket = await storage.updateTicket(id, data);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        customerId: ticket.customerId,
        action: 'Ticket Updated',
        details: `Updated ticket: ${ticket.subject}, Status: ${ticket.status}`,
        ipAddress: req.ip
      });
      
      res.json(ticket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/tickets/:id/comments', authenticate, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      
      // Validate the ticket exists
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      const data = insertTicketCommentSchema.parse({
        ...req.body,
        ticketId,
        userId: (req as any).user.id
      });
      
      const comment = await storage.createTicketComment(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        customerId: ticket.customerId,
        action: 'Ticket Comment Added',
        details: `Added comment to ticket #${ticketId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error adding ticket comment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // RADIUS client routes
  app.get('/api/radius/clients', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const clients = await storage.listRadiusClients();
      res.json(clients);
    } catch (error) {
      console.error('Error listing RADIUS clients:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/radius/clients', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertRadiusClientSchema.parse(req.body);
      const client = await storage.createRadiusClient(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'RADIUS Client Created',
        details: `Created RADIUS client: ${client.name} (${client.ipAddress})`,
        ipAddress: req.ip
      });
      
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating RADIUS client:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/radius/clients/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertRadiusClientSchema.partial().parse(req.body);
      
      const client = await storage.updateRadiusClient(id, data);
      
      if (!client) {
        return res.status(404).json({ message: 'RADIUS client not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'RADIUS Client Updated',
        details: `Updated RADIUS client: ${client.name} (${client.ipAddress})`,
        ipAddress: req.ip
      });
      
      res.json(client);
    } catch (error) {
      console.error('Error updating RADIUS client:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/radius/auth-logs', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.listRadiusAuth(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error listing RADIUS auth logs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // RADIUS Status API for Dashboard
  app.get('/api/radius/status', authenticate, async (req, res) => {
    try {
      // Get count of active sessions (connections within the last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentSessions = await storage.getRadiusAuthsByTimeRange(oneHourAgo, new Date());
      
      // Count unique usernames with successful auth in the last hour
      const activeUsernames = new Set();
      recentSessions.forEach(session => {
        if (session.status === 'accept') {
          activeUsernames.add(session.username);
        }
      });
      
      const activeSessions = activeUsernames.size;
      
      // Get total client count
      const totalClients = await storage.getCustomerCount();
      
      res.json({
        activeSessions,
        totalClients
      });
    } catch (error) {
      console.error('Error retrieving RADIUS status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // RADIUS Customer Status
  app.get('/api/radius/customers/:id', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      // Get customer
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      // Get recent authentication attempts
      const recentAuths = await storage.getRadiusAuthsByUsername(customer.username, 5);
      
      // Check if customer has any active sessions
      const isOnline = recentAuths.some(auth => 
        auth.status === 'accept' && 
        new Date().getTime() - new Date(auth.timestamp).getTime() < 3600000 // within last hour
      );
      
      // Get the most recent session
      const lastSession = recentAuths.length > 0 ? recentAuths[0].timestamp : null;
      
      // Get this month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      
      const monthUsages = await storage.getCustomerUsageByDateRange(
        customerId,
        startOfMonth,
        endOfMonth
      );
      
      // Calculate total usage
      const totalDownload = monthUsages.reduce((sum, usage) => sum + usage.downloadUsage, 0);
      const totalUpload = monthUsages.reduce((sum, usage) => sum + usage.uploadUsage, 0);
      
      res.json({
        online: isOnline,
        lastSession,
        recentAuths,
        usageThisMonth: {
          download: parseFloat(totalDownload.toFixed(2)),
          upload: parseFloat(totalUpload.toFixed(2)),
          total: parseFloat((totalDownload + totalUpload).toFixed(2))
        }
      });
    } catch (error) {
      console.error('Error retrieving RADIUS customer status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // User routes (for user management)
  app.get('/api/users', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      console.error('Error listing users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/users', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'User Created',
        details: `Created user: ${user.username} with role ${user.role}`,
        ipAddress: req.ip
      });
      
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.put('/api/users/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertUserSchema.partial().parse(req.body);
      
      const user = await storage.updateUser(id, data);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'User Updated',
        details: `Updated user: ${user.username}`,
        ipAddress: req.ip
      });
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Network Devices and Topology
  app.get('/api/network/devices', authenticate, async (req, res) => {
    try {
      const devices = await storage.listNetworkDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error listing network devices:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/network/devices/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getNetworkDevice(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Network device not found' });
      }
      
      res.json(device);
    } catch (error) {
      console.error('Error getting network device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/network/devices', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertNetworkDeviceSchema.parse(req.body);
      const device = await storage.createNetworkDevice(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Device Added',
        details: `Added network device ${device.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating network device:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/network/devices/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertNetworkDeviceSchema.partial().parse(req.body);
      
      const device = await storage.updateNetworkDevice(id, data);
      
      if (!device) {
        return res.status(404).json({ message: 'Network device not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Device Updated',
        details: `Updated network device ${device.name}`,
        ipAddress: req.ip
      });
      
      res.json(device);
    } catch (error) {
      console.error('Error updating network device:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/network/devices/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const device = await storage.getNetworkDevice(id);
      
      if (!device) {
        return res.status(404).json({ message: 'Network device not found' });
      }
      
      const success = await storage.deleteNetworkDevice(id);
      
      if (success) {
        // Log the activity
        await storage.createActivityLog({
          userId: (req as any).user.id,
          action: 'Network Device Deleted',
          details: `Deleted network device ${device.name}`,
          ipAddress: req.ip
        });
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete network device' });
      }
    } catch (error) {
      console.error('Error deleting network device:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Network Connections
  app.get('/api/network/connections', authenticate, async (req, res) => {
    try {
      const connections = await storage.listNetworkConnections();
      res.json(connections);
    } catch (error) {
      console.error('Error listing network connections:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/network/connections/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getNetworkConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Network connection not found' });
      }
      
      res.json(connection);
    } catch (error) {
      console.error('Error getting network connection:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/network/connections', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertNetworkConnectionSchema.parse(req.body);
      const connection = await storage.createNetworkConnection(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Connection Added',
        details: `Added connection between devices ${connection.sourceDeviceId} and ${connection.targetDeviceId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(connection);
    } catch (error) {
      console.error('Error creating network connection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/network/connections/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertNetworkConnectionSchema.partial().parse(req.body);
      
      const connection = await storage.updateNetworkConnection(id, data);
      
      if (!connection) {
        return res.status(404).json({ message: 'Network connection not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Connection Updated',
        details: `Updated connection between devices ${connection.sourceDeviceId} and ${connection.targetDeviceId}`,
        ipAddress: req.ip
      });
      
      res.json(connection);
    } catch (error) {
      console.error('Error updating network connection:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/network/connections/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.getNetworkConnection(id);
      
      if (!connection) {
        return res.status(404).json({ message: 'Network connection not found' });
      }
      
      const success = await storage.deleteNetworkConnection(id);
      
      if (success) {
        // Log the activity
        await storage.createActivityLog({
          userId: (req as any).user.id,
          action: 'Network Connection Deleted',
          details: `Deleted connection between devices ${connection.sourceDeviceId} and ${connection.targetDeviceId}`,
          ipAddress: req.ip
        });
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete network connection' });
      }
    } catch (error) {
      console.error('Error deleting network connection:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Network Metrics
  app.get('/api/network/metrics', authenticate, async (req, res) => {
    try {
      const deviceId = req.query.deviceId ? parseInt(req.query.deviceId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const metrics = deviceId
        ? await storage.getNetworkMetricsByDeviceId(deviceId, limit)
        : await storage.listNetworkMetrics(limit);
      
      res.json(metrics);
    } catch (error) {
      console.error('Error listing network metrics:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/network/metrics', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertNetworkMetricSchema.parse(req.body);
      const metric = await storage.createNetworkMetric(data);
      
      res.status(201).json(metric);
    } catch (error) {
      console.error('Error creating network metric:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Topology
  app.get('/api/network/topology', authenticate, async (req, res) => {
    try {
      // Get devices and connections for topology visualization
      const devices = await storage.listNetworkDevices();
      const connections = await storage.listNetworkConnections();
      
      res.json({
        nodes: devices,
        links: connections
      });
    } catch (error) {
      console.error('Error getting network topology:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update device coordinates for topology view
  app.patch('/api/network/devices/:id/coordinates', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({
        coordinates: z.object({
          x: z.number(),
          y: z.number()
        })
      });
      
      const { coordinates } = schema.parse(req.body);
      const device = await storage.updateNetworkDeviceCoordinates(id, coordinates);
      
      if (!device) {
        return res.status(404).json({ message: 'Network device not found' });
      }
      
      res.json(device);
    } catch (error) {
      console.error('Error updating device coordinates:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // PBX System Routes
  
  // PBX Health Check
  app.get('/api/pbx/health', authenticate, async (req, res) => {
    try {
      const status = pbxService.healthCheck();
      res.json(status);
    } catch (error) {
      console.error('Error checking PBX health:', error);
      res.status(500).json({ message: 'Failed to check PBX health' });
    }
  });
  
  // PBX Tenants
  app.get('/api/pbx/tenants', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      let tenants = [];
      
      if (customerId) {
        tenants = await pbxService.getTenantsByCustomerId(customerId);
      } else {
        // In a real implementation, you'd fetch all tenants or handle based on user role
        tenants = [];
      }
      
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching PBX tenants:', error);
      res.status(500).json({ message: 'Failed to fetch PBX tenants' });
    }
  });
  
  app.post('/api/pbx/tenants', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPbxTenantSchema.parse(req.body);
      const tenant = await pbxService.createTenant(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'PBX Tenant Created',
        details: `Created PBX tenant ${tenant.name} for customer ${tenant.customerId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(tenant);
    } catch (error) {
      console.error('Error creating PBX tenant:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PBX Extensions
  app.get('/api/pbx/extensions', authenticate, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      
      if (!tenantId) {
        return res.status(400).json({ message: 'Tenant ID is required' });
      }
      
      const extensions = await pbxService.getExtensionsByTenantId(tenantId);
      res.json(extensions);
    } catch (error) {
      console.error('Error fetching PBX extensions:', error);
      res.status(500).json({ message: 'Failed to fetch PBX extensions' });
    }
  });
  
  app.post('/api/pbx/extensions', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const data = insertPbxExtensionSchema.parse(req.body);
      const extension = await pbxService.createExtension(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'PBX Extension Created',
        details: `Created extension ${extension.extensionNumber} for tenant ${extension.tenantId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(extension);
    } catch (error) {
      console.error('Error creating PBX extension:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PBX Call Routes
  app.post('/api/pbx/call-routes', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPbxCallRouteSchema.parse(req.body);
      const route = await pbxService.createCallRoute(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'PBX Call Route Created',
        details: `Created call route ${route.name} for tenant ${route.tenantId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(route);
    } catch (error) {
      console.error('Error creating PBX call route:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PBX Ring Groups
  app.post('/api/pbx/ring-groups', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const schema = z.object({
        ringGroup: insertPbxRingGroupSchema,
        members: z.array(insertPbxRingGroupMemberSchema.omit({ ringGroupId: true }))
      });
      
      const { ringGroup, members } = schema.parse(req.body);
      const result = await pbxService.createRingGroup(ringGroup, members);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'PBX Ring Group Created',
        details: `Created ring group ${result.name} for tenant ${result.tenantId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating PBX ring group:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PBX IVR Menus
  app.post('/api/pbx/ivr-menus', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const schema = z.object({
        ivrMenu: insertPbxIvrMenuSchema,
        options: z.array(insertPbxIvrMenuOptionSchema.omit({ ivrMenuId: true }))
      });
      
      const { ivrMenu, options } = schema.parse(req.body);
      const result = await pbxService.createIvrMenu(ivrMenu, options);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'PBX IVR Menu Created',
        details: `Created IVR menu ${result.name} for tenant ${result.tenantId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating PBX IVR menu:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // PBX Call Logs
  app.get('/api/pbx/call-logs', authenticate, async (req, res) => {
    try {
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last 7 days
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required' });
      }
      
      const callLogs = await pbxService.getCallLogsByCustomerId(customerId, startDate, endDate);
      res.json(callLogs);
    } catch (error) {
      console.error('Error fetching PBX call logs:', error);
      res.status(500).json({ message: 'Failed to fetch PBX call logs' });
    }
  });

  // PBX Gateway routes
  app.get('/api/pbx/gateways', authenticate, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      
      // Call pbxService to get gateways (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.json([]);
    } catch (error) {
      console.error('Error listing PBX gateways:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pbx/gateways', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPbxGatewaySchema.parse(req.body);
      
      // Call pbxService to create a gateway (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.status(201).json({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error creating PBX gateway:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pbx/gateway-routes', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPbxGatewayRouteSchema.parse(req.body);
      
      // Call pbxService to create a gateway route (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.status(201).json({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error creating PBX gateway route:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // PBX Call Flow routes
  app.get('/api/pbx/call-flows', authenticate, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      
      // Call pbxService to get call flows (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.json([]);
    } catch (error) {
      console.error('Error listing PBX call flows:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pbx/call-flows', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertPbxCallFlowSchema.parse(req.body);
      
      // Call pbxService to create a call flow (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.status(201).json({
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error creating PBX call flow:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/pbx/call-flows/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertPbxCallFlowSchema.partial().parse(req.body);
      
      // Call pbxService to update a call flow (you'll need to implement this in pbx.ts)
      // This is a placeholder response since we don't have the actual implementation yet
      res.json({
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating PBX call flow:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // IPAM - IP Networks routes
  app.get('/api/ipam/networks', authenticate, async (req, res) => {
    try {
      const networks = await storage.listIpNetworks();
      res.json(networks);
    } catch (error) {
      console.error('Error listing IP networks:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/ipam/networks/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const network = await storage.getIpNetwork(id);
      
      if (!network) {
        return res.status(404).json({ message: 'IP network not found' });
      }
      
      res.json(network);
    } catch (error) {
      console.error('Error getting IP network:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/ipam/networks', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertIpNetworkSchema.parse(req.body);
      const network = await storage.createIpNetwork(data);
      res.status(201).json(network);
    } catch (error) {
      console.error('Error creating IP network:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/ipam/networks/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertIpNetworkSchema.partial().parse(req.body);
      
      const network = await storage.updateIpNetwork(id, data);
      
      if (!network) {
        return res.status(404).json({ message: 'IP network not found' });
      }
      
      res.json(network);
    } catch (error) {
      console.error('Error updating IP network:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/ipam/networks/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIpNetwork(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting IP network:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // IPAM - IP Addresses routes
  app.get('/api/ipam/addresses', authenticate, async (req, res) => {
    try {
      const networkId = req.query.networkId ? parseInt(req.query.networkId as string) : undefined;
      
      if (networkId) {
        const addresses = await storage.getIpAddressesByNetworkId(networkId);
        return res.json(addresses);
      }
      
      const addresses = await storage.listIpAddresses();
      res.json(addresses);
    } catch (error) {
      console.error('Error listing IP addresses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/ipam/addresses/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.getIpAddress(id);
      
      if (!address) {
        return res.status(404).json({ message: 'IP address not found' });
      }
      
      res.json(address);
    } catch (error) {
      console.error('Error getting IP address:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/ipam/addresses', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertIpAddressSchema.parse(req.body);
      const address = await storage.createIpAddress(data);
      res.status(201).json(address);
    } catch (error) {
      console.error('Error creating IP address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/ipam/addresses/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertIpAddressSchema.partial().parse(req.body);
      
      const address = await storage.updateIpAddress(id, data);
      
      if (!address) {
        return res.status(404).json({ message: 'IP address not found' });
      }
      
      res.json(address);
    } catch (error) {
      console.error('Error updating IP address:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/ipam/addresses/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIpAddress(id);
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting IP address:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ======== ADVANCED FEATURES API ENDPOINTS =========

  // 1. AI-Powered Network Optimization Endpoints
  app.get('/api/optimizations', authenticate, async (req, res) => {
    try {
      const optimizations = await storage.listNetworkOptimizations();
      res.json(optimizations);
    } catch (error) {
      console.error('Error listing network optimizations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/optimizations/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const optimization = await storage.getNetworkOptimization(id);
      
      if (!optimization) {
        return res.status(404).json({ message: 'Network optimization not found' });
      }
      
      res.json(optimization);
    } catch (error) {
      console.error('Error getting network optimization:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/optimizations', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertNetworkOptimizationSchema.parse(req.body);
      const optimization = await storage.createNetworkOptimization(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Optimization Created',
        details: `Created network optimization for ${optimization.networkArea}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(optimization);
    } catch (error) {
      console.error('Error creating network optimization:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/optimizations/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertNetworkOptimizationSchema.partial().parse(req.body);
      
      const optimization = await storage.updateNetworkOptimization(id, data);
      
      if (!optimization) {
        return res.status(404).json({ message: 'Network optimization not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Optimization Updated',
        details: `Updated network optimization for ${optimization.networkArea}`,
        ipAddress: req.ip
      });
      
      res.json(optimization);
    } catch (error) {
      console.error('Error updating network optimization:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/optimizations/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const optimization = await storage.getNetworkOptimization(id);
      
      if (!optimization) {
        return res.status(404).json({ message: 'Network optimization not found' });
      }
      
      const success = await storage.deleteNetworkOptimization(id);
      
      if (success) {
        // Log the activity
        await storage.createActivityLog({
          userId: (req as any).user.id,
          action: 'Network Optimization Deleted',
          details: `Deleted network optimization for ${optimization.networkArea}`,
          ipAddress: req.ip
        });
        
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete network optimization' });
      }
    } catch (error) {
      console.error('Error deleting network optimization:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 2. Enhanced Security Suite Endpoints
  app.get('/api/security/audits', authenticate, async (req, res) => {
    try {
      const audits = await storage.listSecurityAudits();
      res.json(audits);
    } catch (error) {
      console.error('Error listing security audits:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/security/audits', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertSecurityAuditSchema.parse(req.body);
      const audit = await storage.createSecurityAudit(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Security Audit Created',
        details: `Created security audit: ${audit.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(audit);
    } catch (error) {
      console.error('Error creating security audit:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/security/threats', authenticate, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      let threats;
      
      if (status === 'active') {
        threats = await storage.listActiveSecurityThreats();
      } else {
        threats = await storage.listSecurityThreats();
      }
      
      res.json(threats);
    } catch (error) {
      console.error('Error listing security threats:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/security/threats', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertSecurityThreatSchema.parse(req.body);
      const threat = await storage.createSecurityThreat(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Security Threat Detected',
        details: `Detected security threat: ${threat.name}`,
        type: 'alert',
        ipAddress: req.ip
      });
      
      res.status(201).json(threat);
    } catch (error) {
      console.error('Error creating security threat:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/security/threats/:id/resolve', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const threat = await storage.resolveSecurityThreat(id);
      
      if (!threat) {
        return res.status(404).json({ message: 'Security threat not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Security Threat Resolved',
        details: `Resolved security threat: ${threat.name}`,
        ipAddress: req.ip
      });
      
      res.json(threat);
    } catch (error) {
      console.error('Error resolving security threat:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 3. Customer Self-Service Portal Endpoints
  app.get('/api/customers/:id/portal-settings', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const settings = await storage.getCustomerPortalSettings(customerId);
      
      if (!settings) {
        return res.status(404).json({ message: 'Customer portal settings not found' });
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error getting customer portal settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/customers/:id/portal-settings', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const data = insertCustomerPortalSettingsSchema.parse({
        ...req.body,
        customerId
      });
      
      const settings = await storage.createCustomerPortalSettings(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Customer Portal Settings Created',
        details: `Created portal settings for customer #${customerId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(settings);
    } catch (error) {
      console.error('Error creating customer portal settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/customers/:id/portal-settings', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const data = insertCustomerPortalSettingsSchema.partial().parse(req.body);
      
      const settings = await storage.updateCustomerPortalSettings(customerId, data);
      
      if (!settings) {
        return res.status(404).json({ message: 'Customer portal settings not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Customer Portal Settings Updated',
        details: `Updated portal settings for customer #${customerId}`,
        ipAddress: req.ip
      });
      
      res.json(settings);
    } catch (error) {
      console.error('Error updating customer portal settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/customers/:id/usage-alerts', authenticate, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const alerts = await storage.listUsageAlertsByCustomerId(customerId);
      res.json(alerts);
    } catch (error) {
      console.error('Error listing usage alerts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/usage-alerts', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const data = insertUsageAlertSchema.parse(req.body);
      const alert = await storage.createUsageAlert(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Usage Alert Created',
        details: `Created usage alert for customer #${alert.customerId}`,
        type: 'alert',
        ipAddress: req.ip
      });
      
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating usage alert:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 4. Advanced Revenue Management Endpoints
  app.get('/api/revenue/forecasts', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const forecasts = await storage.listRevenueForecastsByYear(year);
      res.json(forecasts);
    } catch (error) {
      console.error('Error listing revenue forecasts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/revenue/forecasts', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertRevenueForecastSchema.parse(req.body);
      const forecast = await storage.createRevenueForecast(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Revenue Forecast Created',
        details: `Created revenue forecast for ${forecast.month}/${forecast.year}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(forecast);
    } catch (error) {
      console.error('Error creating revenue forecast:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/pricing/rules', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const rules = activeOnly 
        ? await storage.listActiveDynamicPricingRules()
        : await storage.listDynamicPricingRules();
      
      res.json(rules);
    } catch (error) {
      console.error('Error listing dynamic pricing rules:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/pricing/rules', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertDynamicPricingRuleSchema.parse(req.body);
      const rule = await storage.createDynamicPricingRule(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Dynamic Pricing Rule Created',
        details: `Created dynamic pricing rule: ${rule.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(rule);
    } catch (error) {
      console.error('Error creating dynamic pricing rule:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 5. Field Service Management Endpoints
  app.get('/api/technicians', authenticate, async (req, res) => {
    try {
      const availableOnly = req.query.available === 'true';
      const technicians = availableOnly 
        ? await storage.listAvailableFieldTechnicians()
        : await storage.listFieldTechnicians();
      
      res.json(technicians);
    } catch (error) {
      console.error('Error listing field technicians:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/technicians', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const data = insertFieldTechnicianSchema.parse(req.body);
      const technician = await storage.createFieldTechnician(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Field Technician Created',
        details: `Created field technician: ${technician.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(technician);
    } catch (error) {
      console.error('Error creating field technician:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/service-jobs', authenticate, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
      
      let jobs;
      if (customerId) {
        jobs = await storage.listFieldServiceJobsByCustomerId(customerId);
      } else if (status) {
        jobs = await storage.listFieldServiceJobsByStatus(status);
      } else {
        jobs = await storage.listFieldServiceJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      console.error('Error listing service jobs:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/service-jobs', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const data = insertFieldServiceJobSchema.parse(req.body);
      const job = await storage.createFieldServiceJob(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Service Job Created',
        details: `Created service job: ${job.title}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(job);
    } catch (error) {
      console.error('Error creating service job:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/service-jobs/:id/assign', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const schema = z.object({ technicianId: z.number() });
      const { technicianId } = schema.parse(req.body);
      
      const job = await storage.assignTechnicianToJob(jobId, technicianId);
      
      if (!job) {
        return res.status(404).json({ message: 'Service job or technician not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Service Job Assigned',
        details: `Assigned technician #${technicianId} to job #${jobId}`,
        ipAddress: req.ip
      });
      
      res.json(job);
    } catch (error) {
      console.error('Error assigning technician to job:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/service-jobs/:id/complete', authenticate, authorize(['admin', 'support']), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.completeFieldServiceJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: 'Service job not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Service Job Completed',
        details: `Completed service job #${jobId}`,
        ipAddress: req.ip
      });
      
      res.json(job);
    } catch (error) {
      console.error('Error completing service job:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 6. Network Performance Visualization Endpoints
  app.get('/api/visualizations', authenticate, async (req, res) => {
    try {
      const visualizations = await storage.listNetworkVisualizations();
      res.json(visualizations);
    } catch (error) {
      console.error('Error listing network visualizations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/visualizations', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertNetworkVisualizationSchema.parse(req.body);
      const visualization = await storage.createNetworkVisualization(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Network Visualization Created',
        details: `Created network visualization: ${visualization.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(visualization);
    } catch (error) {
      console.error('Error creating network visualization:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/dashboards', authenticate, async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined;
      
      const dashboards = ownerId
        ? await storage.listCustomDashboardsByOwnerId(ownerId)
        : await storage.listCustomDashboards();
      
      res.json(dashboards);
    } catch (error) {
      console.error('Error listing custom dashboards:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/dashboards', authenticate, async (req, res) => {
    try {
      const data = insertCustomDashboardSchema.parse({
        ...req.body,
        ownerId: (req as any).user.id
      });
      
      const dashboard = await storage.createCustomDashboard(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Custom Dashboard Created',
        details: `Created custom dashboard: ${dashboard.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(dashboard);
    } catch (error) {
      console.error('Error creating custom dashboard:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // 7. Multi-Service Integration Endpoints
  app.get('/api/integrations', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const integrations = await storage.listServiceIntegrations();
      res.json(integrations);
    } catch (error) {
      console.error('Error listing service integrations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/integrations', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertServiceIntegrationSchema.parse(req.body);
      const integration = await storage.createServiceIntegration(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Service Integration Created',
        details: `Created service integration: ${integration.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(integration);
    } catch (error) {
      console.error('Error creating service integration:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/service-bundles', authenticate, async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const bundles = activeOnly 
        ? await storage.listActiveServiceBundles()
        : await storage.listServiceBundles();
      
      res.json(bundles);
    } catch (error) {
      console.error('Error listing service bundles:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/service-bundles', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const data = insertServiceBundleSchema.parse(req.body);
      const bundle = await storage.createServiceBundle(data);
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'Service Bundle Created',
        details: `Created service bundle: ${bundle.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(bundle);
    } catch (error) {
      console.error('Error creating service bundle:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // OpenAI-powered recommendation endpoints
  app.post('/api/ai/recommend/optimizations', authenticate, authorize(['admin']), async (req, res) => {
    try {
      // Check if we have the required API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
        });
      }
      
      const schema = z.object({
        networkIds: z.array(z.number()).optional(),
        metricThreshold: z.number().optional().default(0.7),
        lookbackDays: z.number().optional().default(7)
      });
      
      const { networkIds, metricThreshold, lookbackDays } = schema.parse(req.body);
      
      // At this point, we would use OpenAI to analyze network data and make recommendations
      // This is a placeholder for the actual implementation
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'AI Optimization Analysis',
        details: `Requested AI-powered network optimization recommendations`,
        ipAddress: req.ip
      });
      
      // Return a sample response for now
      res.json({
        recommendations: [
          {
            title: "Bandwidth optimization",
            description: "Based on usage patterns, increase bandwidth allocation during peak hours (10AM-2PM) on Network #5",
            priority: "high",
            estimatedImpact: "15% improvement in response times"
          },
          {
            title: "Traffic shaping",
            description: "Implement QoS policies for real-time applications to reduce jitter on Network #3",
            priority: "medium",
            estimatedImpact: "30% reduction in VoIP packet loss"
          }
        ],
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/ai/analyze/security', authenticate, authorize(['admin']), async (req, res) => {
    try {
      // Check if we have the required API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ 
          message: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' 
        });
      }
      
      const schema = z.object({
        logData: z.string(),
        securityContext: z.string().optional()
      });
      
      const { logData, securityContext } = schema.parse(req.body);
      
      // At this point, we would use OpenAI to analyze security logs
      // This is a placeholder for the actual implementation
      
      // Log the activity
      await storage.createActivityLog({
        userId: (req as any).user.id,
        action: 'AI Security Analysis',
        details: `Requested AI-powered security analysis of log data`,
        ipAddress: req.ip
      });
      
      // Return a sample response for now
      res.json({
        threats: [
          {
            type: "Suspicious Access Pattern",
            confidence: 0.85,
            description: "Multiple failed login attempts from IP 192.168.1.100",
            recommendedAction: "Add IP to watchlist and enable additional authentication factors"
          }
        ],
        summary: "Log analysis detected potential brute force attack patterns",
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing security with AI:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ========== CUSTOMER PORTAL ROUTES ==========
  
  // Customer authentication
  app.post('/api/customer/login', customerLogin);
  
  // Get customer profile
  app.get('/api/customer/profile', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      
      // Don't return the password
      const { password, ...customerData } = customer;
      
      res.json(customerData);
    } catch (error) {
      console.error('Error getting customer profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update customer profile
  app.put('/api/customer/profile', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const schema = z.object({
        email: z.string().email().optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      const updatedCustomer = await storage.updateCustomer(customer.id, data);
      
      if (!updatedCustomer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Log the activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'Profile Updated',
        details: `Customer ${customer.username} updated their profile`,
        ipAddress: req.ip
      });
      
      // Don't return the password
      const { password, ...customerData } = updatedCustomer;
      
      res.json(customerData);
    } catch (error) {
      console.error('Error updating customer profile:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer usage data
  app.get('/api/customer/usage', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get RADIUS accounting data for the customer
      const accountingData = await storage.getCustomerRadiusAccountingData(customer.id, startOfMonth, endOfMonth);
      
      // Calculate total download/upload usage
      let downloadedBytes = 0;
      let uploadedBytes = 0;
      
      accountingData.forEach(entry => {
        downloadedBytes += entry.downloadBytes || 0;
        uploadedBytes += entry.uploadBytes || 0;
      });
      
      // Convert to GB for display
      const downloadedGB = downloadedBytes / (1024 * 1024 * 1024);
      const uploadedGB = uploadedBytes / (1024 * 1024 * 1024);
      
      // Get the customer's plan to determine their data limit
      let limit = 500; // Default limit in GB
      if (customer.planId) {
        const plan = await storage.getPlan(customer.planId);
        if (plan && plan.dataLimit) {
          limit = plan.dataLimit;
        }
      }
      
      res.json({
        downloadedGB,
        uploadedGB,
        totalGB: downloadedGB + uploadedGB,
        limit,
        periodStart: startOfMonth.toISOString(),
        periodEnd: endOfMonth.toISOString(),
        accountingData
      });
    } catch (error) {
      console.error('Error getting customer usage:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer billing history
  app.get('/api/customer/billing', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const invoices = await storage.getCustomerInvoices(customer.id);
      
      res.json(invoices);
    } catch (error) {
      console.error('Error getting customer billing:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer service plan
  app.get('/api/customer/plan', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      
      if (!customer.planId) {
        return res.status(404).json({ message: 'No plan assigned to customer' });
      }
      
      const plan = await storage.getPlan(customer.planId);
      
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      
      res.json(plan);
    } catch (error) {
      console.error('Error getting customer plan:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer tickets
  app.get('/api/customer/tickets', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const tickets = await storage.getTicketsByCustomerId(customer.id);
      
      res.json(tickets);
    } catch (error) {
      console.error('Error getting customer tickets:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create customer ticket
  app.post('/api/customer/tickets', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      
      const schema = z.object({
        subject: z.string(),
        description: z.string(),
        priority: z.string().optional()
      });
      
      const data = schema.parse(req.body);
      
      const ticket = await storage.createTicket({
        customerId: customer.id,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'medium',
        status: 'open',
        assignedTo: null
      });
      
      // Log the activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'Ticket Created',
        details: `Customer ${customer.username} created ticket: ${ticket.subject}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Error creating customer ticket:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Add comment to customer ticket
  app.post('/api/customer/tickets/:id/comments', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const ticketId = parseInt(req.params.id);
      
      // Verify the ticket belongs to this customer
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      if (ticket.customerId !== customer.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const schema = z.object({
        content: z.string()
      });
      
      const data = schema.parse(req.body);
      
      const comment = await storage.createTicketComment({
        ticketId,
        userId: null,
        customerId: customer.id,
        content: data.content
      });
      
      // Log the activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'Ticket Comment Added',
        details: `Customer ${customer.username} added comment to ticket #${ticketId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error adding ticket comment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer portal settings
  app.get('/api/customer/portal-settings', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const settings = await storage.getCustomerPortalSettings(customer.id);
      
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          customerId: customer.id,
          dashboardLayout: {
            widgets: [
              { id: 'usage', position: 0 },
              { id: 'billing', position: 1 },
              { id: 'tickets', position: 2 },
              { id: 'plan', position: 3 }
            ]
          },
          notificationPreferences: {
            email: true,
            sms: false,
            usageAlerts: true,
            billingAlerts: true,
            serviceAlerts: true
          },
          uiPreferences: {
            theme: 'light',
            language: 'en',
            compactView: false
          },
          accessControls: {
            canManageBilling: true,
            canCreateTickets: true,
            canViewUsage: true
          }
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error getting customer portal settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Update customer portal settings
  app.put('/api/customer/portal-settings', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const settings = await storage.getCustomerPortalSettings(customer.id);
      
      const data = insertCustomerPortalSettingsSchema.partial().parse(req.body);
      
      let updatedSettings;
      
      if (!settings) {
        // Create new settings if none exist
        updatedSettings = await storage.createCustomerPortalSettings({
          customerId: customer.id,
          ...data
        });
      } else {
        // Update existing settings
        updatedSettings = await storage.updateCustomerPortalSettings(customer.id, data);
      }
      
      // Log the activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'Portal Settings Updated',
        details: `Customer ${customer.username} updated portal settings`,
        ipAddress: req.ip
      });
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating customer portal settings:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Create usage alert
  app.post('/api/customer/usage-alerts', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      
      const schema = z.object({
        name: z.string(),
        threshold: z.number().min(1).max(100),
        type: z.string(),
        actions: z.array(z.object({
          type: z.string(),
          config: z.record(z.any())
        })).optional()
      });
      
      const data = schema.parse(req.body);
      
      const alert = await storage.createUsageAlert({
        customerId: customer.id,
        name: data.name,
        threshold: data.threshold,
        type: data.type,
        actions: data.actions || [],
        enabled: true
      });
      
      // Log the activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'Usage Alert Created',
        details: `Customer ${customer.username} created usage alert: ${alert.name}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating usage alert:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get customer PBX services
  app.get('/api/customer/pbx', authenticateCustomer, async (req, res) => {
    try {
      const customer = (req as any).customer;
      const tenants = await pbxService.getTenantsByCustomerId(customer.id);
      
      res.json(tenants);
    } catch (error) {
      console.error('Error getting customer PBX services:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Analytics API routes
  app.get("/api/analytics/revenue", authenticate, async (req, res) => {
    const { dateRange, aggregation } = req.query;
    
    try {
      // Here we would get actual revenue data from the database
      // For now, we'll return a sample response
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const now = new Date();
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 10000) + 10000,
          expenses: Math.floor(Math.random() * 5000) + 5000,
          profit: Math.floor(Math.random() * 5000) + 3000,
        });
      }
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ message: "Error fetching revenue data" });
    }
  });
  
  app.get("/api/analytics/customer-growth", authenticate, async (req, res) => {
    const { dateRange, aggregation } = req.query;
    
    try {
      // Here we would get actual customer growth data from the database
      // For now, we'll return a sample response
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const now = new Date();
      const data = [];
      let cumulativeCustomers = 1200;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const newCustomers = Math.floor(Math.random() * 10) + 1;
        cumulativeCustomers += newCustomers;
        
        data.push({
          date: date.toISOString().split('T')[0],
          newCustomers,
          totalCustomers: cumulativeCustomers,
          churnedCustomers: Math.max(0, Math.floor(Math.random() * 3)),
        });
      }
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching customer growth data:', error);
      res.status(500).json({ message: "Error fetching customer growth data" });
    }
  });
  
  app.get("/api/analytics/package-distribution", authenticate, async (req, res) => {
    try {
      // Get active subscriptions grouped by plan
      const result = await db
        .select({
          name: plans.name,
          count: sql`count(${subscriptions.id})::int`,
        })
        .from(subscriptions)
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(eq(subscriptions.status, 'active'))
        .groupBy(plans.name);
      
      // Get total count to calculate percentages
      const totalSubscriptions = result.reduce((sum, item) => sum + item.count, 0);
      
      // Format for pie chart with percentages
      const data = result.map(item => ({
        name: item.name,
        value: item.count,
        percentage: Math.round((item.count / totalSubscriptions) * 100)
      }));
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching package distribution data:', error);
      res.status(500).json({ message: "Error fetching package distribution data" });
    }
  });
  
  app.get("/api/analytics/bandwidth-trends", authenticate, async (req, res) => {
    const { dateRange, aggregation } = req.query;
    
    try {
      // Set date range
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      
      // Query usage data aggregated by day
      const result = await db
        .select({
          date: sql`date_trunc('day', ${usages.date})::date`,
          download: sql`sum(${usages.downloadUsage})::float`,
          upload: sql`sum(${usages.uploadUsage})::float`,
        })
        .from(usages)
        .where(gte(usages.date, startDate))
        .groupBy(sql`date_trunc('day', ${usages.date})`)
        .orderBy(sql`date_trunc('day', ${usages.date})`);
      
      // Format for chart display
      const data = result.map(item => ({
        date: item.date.toISOString().split('T')[0],
        download: Number(item.download.toFixed(2)),
        upload: Number(item.upload.toFixed(2)),
        total: Number((item.download + item.upload).toFixed(2))
      }));
      
      // If no data exists for some days, fill in with zeros
      const dateMap = new Map(data.map(item => [item.date, item]));
      const filledData = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        if (dateMap.has(dateKey)) {
          filledData.push(dateMap.get(dateKey));
        } else {
          filledData.push({
            date: dateKey,
            download: 0,
            upload: 0,
            total: 0
          });
        }
      }
      
      res.status(200).json(filledData);
    } catch (error) {
      console.error('Error fetching bandwidth trends data:', error);
      res.status(500).json({ message: "Error fetching bandwidth trends data" });
    }
  });
  
  app.get("/api/analytics/service-uptime", authenticate, async (req, res) => {
    try {
      // Here we would get actual service uptime data from the database
      // For now, we'll return a sample response
      const data = [
        { name: "RADIUS", uptime: 99.98, incidents: 1 },
        { name: "PBX", uptime: 99.95, incidents: 2 },
        { name: "Billing System", uptime: 100, incidents: 0 },
        { name: "Customer Portal", uptime: 99.99, incidents: 1 },
        { name: "Network Core", uptime: 99.999, incidents: 0 },
      ];
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching service uptime data:', error);
      res.status(500).json({ message: "Error fetching service uptime data" });
    }
  });
  
  app.get("/api/analytics/radius-stats", authenticate, async (req, res) => {
    const { dateRange, aggregation } = req.query;
    
    try {
      // Set date range
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      
      // Query RADIUS authentication data aggregated by day
      const result = await db
        .select({
          date: sql`date_trunc('day', ${radiusAuth.timestamp})::date`,
          authentications: sql`count(${radiusAuth.id})::int`,
          authFailed: sql`count(case when ${radiusAuth.status} = 'reject' then 1 end)::int`,
          uniqueUsers: sql`count(distinct ${radiusAuth.username})::int`
        })
        .from(radiusAuth)
        .where(gte(radiusAuth.timestamp, startDate))
        .groupBy(sql`date_trunc('day', ${radiusAuth.timestamp})`)
        .orderBy(sql`date_trunc('day', ${radiusAuth.timestamp})`);
      
      // Format for chart display
      const data = result.map(item => ({
        date: item.date.toISOString().split('T')[0],
        authentications: item.authentications,
        authFailed: item.authFailed,
        uniqueUsers: item.uniqueUsers
      }));
      
      // If no data exists for some days, fill in with zeros
      const dateMap = new Map(data.map(item => [item.date, item]));
      const filledData = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        if (dateMap.has(dateKey)) {
          filledData.push(dateMap.get(dateKey));
        } else {
          filledData.push({
            date: dateKey,
            authentications: 0,
            authFailed: 0,
            uniqueUsers: 0
          });
        }
      }
      
      res.status(200).json(filledData);
    } catch (error) {
      console.error('Error fetching RADIUS stats data:', error);
      res.status(500).json({ message: "Error fetching RADIUS stats data" });
    }
  });
  
  app.get("/api/analytics/ticket-stats", authenticate, async (req, res) => {
    const { dateRange, aggregation } = req.query;
    
    try {
      // Here we would get actual ticket stats data from the database
      // For now, we'll return a sample response
      const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const now = new Date();
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          opened: Math.floor(Math.random() * 15) + 5,
          closed: Math.floor(Math.random() * 12) + 3,
          responseTime: Math.floor(Math.random() * 120) + 60, // minutes
        });
      }
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching ticket stats data:', error);
      res.status(500).json({ message: "Error fetching ticket stats data" });
    }
  });
  
  app.get("/api/analytics/regional-distribution", authenticate, async (req, res) => {
    try {
      // Here we would get actual regional distribution data from the database
      // For now, we'll return a sample response
      const data = [
        { name: "Gauteng", customers: 450, percentage: 45 },
        { name: "Western Cape", customers: 250, percentage: 25 },
        { name: "KwaZulu-Natal", customers: 150, percentage: 15 },
        { name: "Eastern Cape", customers: 80, percentage: 8 },
        { name: "Free State", customers: 70, percentage: 7 },
      ];
      
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching regional distribution data:', error);
      res.status(500).json({ message: "Error fetching regional distribution data" });
    }
  });
  
  // Add a new activity log entry
  app.post("/api/activity", authenticate, async (req, res) => {
    try {
      const { action, details = null, userId = null, customerId = null, ipAddress = null, type = 'system' } = req.body;
      
      if (!action) {
        return res.status(400).json({ message: "Action is required" });
      }
      
      // In a real implementation, we would save to the database
      // const activityLog = await storage.createActivityLog({
      //   action,
      //   details,
      //   userId,
      //   customerId,
      //   ipAddress,
      //   type
      // });
      
      // For demo, we'll just return a success response
      res.status(201).json({ success: true, message: "Activity logged successfully" });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({ message: "Error logging activity" });
    }
  });

  // Activity Log API route
  app.get("/api/activity", authenticate, async (req, res) => {
    const { dateRange, type } = req.query;
    
    try {
      // Here we would get actual activity log data from the database
      // For now, we'll return a sample response
      const now = new Date();
      const data = [
        {
          id: 1,
          action: 'Login',
          details: 'User logged in from 192.168.1.100',
          timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
          userId: 2,
          username: 'admin2',
          ipAddress: '192.168.1.100',
          type: 'auth'
        },
        {
          id: 2,
          action: 'Customer Created',
          details: 'New customer "ABC Company" was created',
          timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
          userId: 2,
          username: 'admin2',
          ipAddress: '192.168.1.100',
          type: 'customer'
        },
        {
          id: 3,
          action: 'Configuration Changed',
          details: 'Updated RADIUS server settings',
          timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
          userId: 2,
          username: 'admin2',
          ipAddress: '192.168.1.100',
          type: 'system'
        },
        {
          id: 4,
          action: 'Ticket Created',
          details: 'New support ticket #123 created',
          timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
          userId: null,
          username: null,
          customerId: 5,
          customerName: 'John Doe',
          ipAddress: '192.168.2.50',
          type: 'ticket'
        },
        {
          id: 5,
          action: 'PBX Call',
          details: 'Outbound call to +27123456789 (Duration: 3:45)',
          timestamp: new Date(now.getTime() - 6 * 3600000).toISOString(),
          userId: null,
          username: null,
          customerId: 3,
          customerName: 'Acme Corporation',
          ipAddress: null,
          type: 'pbx'
        },
        {
          id: 6,
          action: 'Network Alert',
          details: 'High bandwidth usage detected on primary link',
          timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(),
          userId: null,
          username: null,
          ipAddress: null,
          type: 'alert'
        },
        {
          id: 7,
          action: 'Package Changed',
          details: 'Customer "XYZ Ltd" upgraded from Standard to Premium',
          timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
          userId: 1,
          username: 'admin',
          customerId: 8,
          customerName: 'XYZ Ltd',
          ipAddress: '192.168.1.101',
          type: 'billing'
        },
        {
          id: 8,
          action: 'System Backup',
          details: 'Daily database backup completed',
          timestamp: new Date(now.getTime() - 28 * 3600000).toISOString(),
          userId: null,
          username: null,
          ipAddress: null,
          type: 'system'
        },
        {
          id: 9,
          action: 'Failed Login Attempt',
          details: 'Multiple failed login attempts from 192.168.3.200',
          timestamp: new Date(now.getTime() - 36 * 3600000).toISOString(),
          userId: null,
          username: null,
          ipAddress: '192.168.3.200',
          type: 'security'
        },
        {
          id: 10,
          action: 'RADIUS Authentication',
          details: 'User "customer001" authenticated successfully',
          timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(),
          userId: null,
          username: null,
          customerId: 12,
          customerName: 'customer001',
          ipAddress: '192.168.4.50',
          type: 'radius'
        },
      ];
      
      // Filter by date range if specified
      let filteredData = [...data];
      if (dateRange) {
        const daysAgo = dateRange === '1day' ? 1 : dateRange === '7days' ? 7 : 30;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 3600000);
        
        filteredData = filteredData.filter(item => 
          new Date(item.timestamp) > cutoffDate
        );
      }
      
      // Filter by type if specified
      if (type && type !== 'all') {
        filteredData = filteredData.filter(item => item.type === type);
      }
      
      res.status(200).json(filteredData);
    } catch (error) {
      console.error('Error fetching activity log data:', error);
      res.status(500).json({ message: "Error fetching activity log data" });
    }
  });

  return httpServer;
}
