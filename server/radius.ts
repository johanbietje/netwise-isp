import { RadiusRequest, RadiusResponse } from '@shared/types';
import { storage } from './storage';

// Simple RADIUS server implementation
export class RadiusService {
  constructor() {
    console.log('RADIUS service initialized');
  }

  // Authenticate a user and return appropriate RADIUS response
  async authenticate(request: RadiusRequest): Promise<RadiusResponse> {
    console.log(`RADIUS authentication request for ${request.username} from ${request.clientIpAddress}`);
    
    try {
      // First, check if the RADIUS client (NAS) is authorized
      const client = await storage.getRadiusClientByIp(request.clientIpAddress);
      if (!client || !client.active) {
        console.log(`Unauthorized RADIUS client: ${request.clientIpAddress}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: 'Unauthorized RADIUS client'
        };
      }
      
      // Next, check if the user exists and is active
      const customer = await storage.getCustomerByUsername(request.username);
      if (!customer) {
        console.log(`User not found: ${request.username}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: 'User not found'
        };
      }
      
      if (customer.status !== 'active') {
        console.log(`User not active: ${request.username}, status: ${customer.status}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: `Account is ${customer.status}`
        };
      }
      
      // Verify password (in a real system, this would use proper hashing)
      if (customer.password !== request.password) {
        console.log(`Invalid password for user: ${request.username}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: 'Invalid password'
        };
      }
      
      // Get the customer's subscription to determine bandwidth limits
      const subscription = await storage.getSubscriptionByCustomerId(customer.id);
      if (!subscription || subscription.status !== 'active') {
        console.log(`No active subscription for user: ${request.username}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: 'No active subscription'
        };
      }
      
      // Get the plan details
      const plan = await storage.getPlan(subscription.planId);
      if (!plan) {
        console.log(`Plan not found for subscription: ${subscription.id}`);
        await storage.createRadiusAuth({
          username: request.username,
          clientIpAddress: request.clientIpAddress,
          status: 'reject'
        });
        return {
          status: 'reject',
          message: 'Invalid plan'
        };
      }
      
      // Authentication successful - log the successful auth
      await storage.createRadiusAuth({
        username: request.username,
        clientIpAddress: request.clientIpAddress,
        status: 'accept'
      });
      
      // Log this activity
      await storage.createActivityLog({
        customerId: customer.id,
        action: 'RADIUS Authentication',
        details: `User ${customer.username} authenticated from ${request.clientIpAddress}`,
        ipAddress: request.clientIpAddress
      });
      
      // Return RADIUS response with the appropriate attributes for the user's plan
      return {
        status: 'accept',
        message: 'Authentication successful',
        attributes: {
          'Framed-IP-Address': '0.0.0.0',  // Let NAS assign dynamic IP
          'Session-Timeout': 86400,        // 24 hours in seconds
          'Acct-Interim-Interval': 300,    // 5 minutes for accounting updates
          'Mikrotik-Rate-Limit': `${plan.downloadSpeed}M/${plan.uploadSpeed}M` // Download/Upload limits in Mbps
        }
      };
    } catch (error) {
      console.error('RADIUS authentication error:', error);
      return {
        status: 'reject',
        message: 'Internal server error'
      };
    }
  }

  // Handle accounting request (start, stop, interim-update)
  async accounting(username: string, acctType: string, sessionTime: number, inputOctets: number, outputOctets: number): Promise<boolean> {
    try {
      // Find the customer
      const customer = await storage.getCustomerByUsername(username);
      if (!customer) {
        console.log(`Accounting: User not found: ${username}`);
        return false;
      }
      
      // If this is a stop record, update the usage statistics
      if (acctType === 'stop') {
        // Convert bytes to GB
        const downloadUsage = outputOctets / (1024 * 1024 * 1024);
        const uploadUsage = inputOctets / (1024 * 1024 * 1024);
        
        // Record usage
        await storage.createUsage({
          customerId: customer.id,
          downloadUsage,
          uploadUsage,
          date: new Date()
        });
        
        // Log the activity
        await storage.createActivityLog({
          customerId: customer.id,
          action: 'Session Ended',
          details: `Session duration: ${Math.floor(sessionTime / 60)} minutes, Download: ${downloadUsage.toFixed(2)} GB, Upload: ${uploadUsage.toFixed(2)} GB`,
          ipAddress: ''
        });
        
        // Check if customer has exceeded their data limit
        const subscription = await storage.getSubscriptionByCustomerId(customer.id);
        if (subscription) {
          const plan = await storage.getPlan(subscription.planId);
          if (plan && plan.dataLimit) {
            // Get current month's usage
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date();
            endOfMonth.setHours(23, 59, 59, 999);
            
            const monthUsages = await storage.getCustomerUsageByDateRange(
              customer.id,
              startOfMonth,
              endOfMonth
            );
            
            const totalDownload = monthUsages.reduce((sum, usage) => sum + usage.downloadUsage, 0);
            const totalUpload = monthUsages.reduce((sum, usage) => sum + usage.uploadUsage, 0);
            const totalUsage = totalDownload + totalUpload;
            
            // If over 90% of limit, log a warning
            if (totalUsage >= plan.dataLimit * 0.9) {
              await storage.createActivityLog({
                customerId: customer.id,
                action: 'Bandwidth Alert',
                details: `Customer ${customer.username} has used ${Math.round(totalUsage)} GB of ${plan.dataLimit} GB limit (${Math.round(totalUsage / plan.dataLimit * 100)}%)`,
                ipAddress: ''
              });
              
              // If over limit, consider applying policy (could downgrade speed or bill for overage)
              if (totalUsage > plan.dataLimit) {
                // In a real implementation, this might trigger a notification or policy change
                console.log(`Customer ${customer.username} has exceeded their data limit`);
              }
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('RADIUS accounting error:', error);
      return false;
    }
  }
}

export const radiusService = new RadiusService();
