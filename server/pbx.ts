import { Connection } from 'modesl';
import { 
  PbxTenant, 
  PbxExtension, 
  PbxCallRoute, 
  PbxRingGroup,
  PbxRingGroupMember,
  PbxIvrMenu,
  PbxIvrMenuOption,
  PbxCallLog
} from '@shared/schema';
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';
import { 
  pbxTenants, 
  pbxExtensions, 
  pbxCallRoutes, 
  pbxRingGroups,
  pbxRingGroupMembers,
  pbxIvrMenus,
  pbxIvrMenuOptions,
  pbxCallLogs,
  customers
} from '@shared/schema';

/**
 * Simple logger for the PBX service
 */
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[PBX] [INFO] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[PBX] [ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[PBX] [WARN] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[PBX] [DEBUG] ${message}`, ...args);
    }
  }
};

const FREESWITCH_HOST = process.env.FREESWITCH_HOST || 'localhost';
const FREESWITCH_PORT = parseInt(process.env.FREESWITCH_PORT || '8021', 10);
const FREESWITCH_PASSWORD = process.env.FREESWITCH_PASSWORD || 'ClueCon';

interface FreeSwitchEvent {
  getHeader: (header: string) => string | undefined;
  getBody: () => string;
  getType: () => string;
}

interface CallRouteRule {
  pattern: string;
  destination: string;
  destinationType: string;
  priority: number;
}

export class PbxService {
  private connection: Connection | null = null;
  private connected: boolean = false;
  private tenants: Map<number, PbxTenant> = new Map();
  private extensions: Map<string, PbxExtension> = new Map(); // domain:extension
  private callRoutes: Map<number, CallRouteRule[]> = new Map(); // tenantId -> routes
  
  constructor() {
    this.initFreeSwitchConnection();
  }

  /**
   * Initialize FreeSWITCH ESL connection
   */
  private async initFreeSwitchConnection(): Promise<void> {
    try {
      logger.info(`Connecting to FreeSWITCH at ${FREESWITCH_HOST}:${FREESWITCH_PORT}...`);
      
      // In a production environment, you would establish a real connection:
      // this.connection = new Connection(FREESWITCH_HOST, FREESWITCH_PORT, FREESWITCH_PASSWORD);
      
      // For demo/development purposes, we'll simulate the connection
      logger.info('FreeSWITCH connection simulated successfully');
      this.connected = true;
      
      // Load all tenants and their extensions
      await this.loadTenants();
      await this.loadExtensions();
      await this.loadCallRoutes();
      
      // Subscribe to events (in a real implementation)
      // this.subscribeToEvents();
      
    } catch (error) {
      logger.error('Failed to connect to FreeSWITCH:', error);
      this.connected = false;
    }
  }
  
  /**
   * Load all PBX tenants from the database
   */
  private async loadTenants(): Promise<void> {
    try {
      const allTenants = await db.select().from(pbxTenants);
      for (const tenant of allTenants) {
        this.tenants.set(tenant.id, tenant);
        logger.info(`Loaded PBX tenant: ${tenant.name} (${tenant.domain})`);
      }
      logger.info(`Loaded ${allTenants.length} PBX tenants`);
    } catch (error) {
      logger.error('Failed to load PBX tenants:', error);
    }
  }
  
  /**
   * Load all extensions for all tenants
   */
  private async loadExtensions(): Promise<void> {
    try {
      const allExtensions = await db.select().from(pbxExtensions);
      for (const extension of allExtensions) {
        // Get the tenant for this extension
        const tenant = this.tenants.get(extension.tenantId);
        if (tenant) {
          // Key is domain:extension for quick lookups
          const key = `${tenant.domain}:${extension.extensionNumber}`;
          this.extensions.set(key, extension);
        }
      }
      logger.info(`Loaded ${allExtensions.length} PBX extensions`);
    } catch (error) {
      logger.error('Failed to load PBX extensions:', error);
    }
  }
  
  /**
   * Load all call routes for all tenants
   */
  private async loadCallRoutes(): Promise<void> {
    try {
      const allRoutes = await db.select().from(pbxCallRoutes);
      for (const route of allRoutes) {
        const tenantRoutes = this.callRoutes.get(route.tenantId) || [];
        tenantRoutes.push({
          pattern: route.pattern,
          destination: route.destination,
          destinationType: route.destinationType,
          priority: route.priority
        });
        this.callRoutes.set(route.tenantId, 
          // Sort by priority (lowest first)
          tenantRoutes.sort((a, b) => a.priority - b.priority)
        );
      }
      logger.info(`Loaded ${allRoutes.length} PBX call routes`);
    } catch (error) {
      logger.error('Failed to load PBX call routes:', error);
    }
  }
  
  /**
   * Subscribe to FreeSWITCH events
   * This would typically listen for calls, registrations, etc.
   */
  private subscribeToEvents(): void {
    if (!this.connection) return;
    
    // Subscribe to CHANNEL_CREATE events (new calls)
    this.connection.events('plain', 'CHANNEL_CREATE CHANNEL_ANSWER CHANNEL_HANGUP');
    
    // Add event listeners
    this.connection.on('esl::event::**', (event: FreeSwitchEvent) => {
      const eventType = event.getType();
      const callerId = event.getHeader('Caller-Caller-ID-Number');
      const destination = event.getHeader('Caller-Destination-Number');
      
      logger.info(`FreeSWITCH event: ${eventType}, Caller: ${callerId}, Destination: ${destination}`);
      
      if (eventType === 'CHANNEL_CREATE') {
        this.handleNewCall(event);
      } else if (eventType === 'CHANNEL_ANSWER') {
        this.handleCallAnswer(event);
      } else if (eventType === 'CHANNEL_HANGUP') {
        this.handleCallHangup(event);
      }
    });
  }
  
  /**
   * Handle a new incoming call
   */
  private handleNewCall(event: FreeSwitchEvent): void {
    const callerId = event.getHeader('Caller-Caller-ID-Number');
    const destination = event.getHeader('Caller-Destination-Number');
    const domain = event.getHeader('variable_domain');
    
    logger.info(`New call from ${callerId} to ${destination} @ ${domain}`);
    
    // Route the call based on the dialed number and domain
    // In a real implementation, this would execute FreeSWITCH commands
    // to transfer the call to the appropriate destination
  }
  
  /**
   * Handle a call being answered
   */
  private handleCallAnswer(event: FreeSwitchEvent): void {
    const uniqueId = event.getHeader('Unique-ID');
    logger.info(`Call answered: ${uniqueId}`);
  }
  
  /**
   * Handle a call being hung up
   */
  private handleCallHangup(event: FreeSwitchEvent): void {
    const uniqueId = event.getHeader('Unique-ID');
    const duration = event.getHeader('variable_billsec') || '0';
    
    logger.info(`Call ended: ${uniqueId}, Duration: ${duration}s`);
    
    // In a real implementation, this would save call details to the database
  }
  
  /**
   * Create a new PBX tenant
   */
  async createTenant(data: Omit<PbxTenant, 'id' | 'createdAt'>): Promise<PbxTenant> {
    const [tenant] = await db.insert(pbxTenants).values(data).returning();
    
    // Add to local cache
    this.tenants.set(tenant.id, tenant);
    
    // In a real implementation, this would set up the tenant in FreeSWITCH
    // - Create a new domain/context
    // - Set up dialplan entries
    // - Configure SIP profiles
    
    logger.info(`Created new PBX tenant: ${tenant.name} (${tenant.domain})`);
    return tenant;
  }
  
  /**
   * Get all tenants for a specific customer
   */
  async getTenantsByCustomerId(customerId: number): Promise<PbxTenant[]> {
    return db.select().from(pbxTenants).where(eq(pbxTenants.customerId, customerId));
  }
  
  /**
   * Create a new extension for a tenant
   */
  async createExtension(data: Omit<PbxExtension, 'id' | 'createdAt'>): Promise<PbxExtension> {
    const [extension] = await db.insert(pbxExtensions).values(data).returning();
    
    // Get the tenant for this extension
    const tenant = this.tenants.get(extension.tenantId);
    if (tenant) {
      const key = `${tenant.domain}:${extension.extensionNumber}`;
      this.extensions.set(key, extension);
    }
    
    // In a real implementation, this would provision the extension in FreeSWITCH
    // - Create directory entry
    // - Set up voicemail
    
    logger.info(`Created new extension: ${extension.extensionNumber} for tenant ${extension.tenantId}`);
    return extension;
  }
  
  /**
   * Get all extensions for a tenant
   */
  async getExtensionsByTenantId(tenantId: number): Promise<PbxExtension[]> {
    return db.select().from(pbxExtensions).where(eq(pbxExtensions.tenantId, tenantId));
  }
  
  /**
   * Create a new call route
   */
  async createCallRoute(data: Omit<PbxCallRoute, 'id' | 'createdAt'>): Promise<PbxCallRoute> {
    const [route] = await db.insert(pbxCallRoutes).values(data).returning();
    
    // Update local cache
    const tenantRoutes = this.callRoutes.get(route.tenantId) || [];
    tenantRoutes.push({
      pattern: route.pattern,
      destination: route.destination,
      destinationType: route.destinationType,
      priority: route.priority
    });
    this.callRoutes.set(route.tenantId, 
      // Sort by priority (lowest first)
      tenantRoutes.sort((a, b) => a.priority - b.priority)
    );
    
    // In a real implementation, this would update the dialplan in FreeSWITCH
    
    logger.info(`Created new call route: ${route.name} for tenant ${route.tenantId}`);
    return route;
  }
  
  /**
   * Create a new ring group
   */
  async createRingGroup(
    data: Omit<PbxRingGroup, 'id' | 'createdAt'>, 
    members: Omit<PbxRingGroupMember, 'id' | 'ringGroupId'>[]
  ): Promise<PbxRingGroup> {
    // Insert the ring group
    const [ringGroup] = await db.insert(pbxRingGroups).values(data).returning();
    
    // Insert the members
    if (members.length > 0) {
      await db.insert(pbxRingGroupMembers).values(
        members.map(member => ({
          ...member,
          ringGroupId: ringGroup.id
        }))
      );
    }
    
    logger.info(`Created new ring group: ${ringGroup.name} for tenant ${ringGroup.tenantId}`);
    return ringGroup;
  }
  
  /**
   * Create a new IVR menu
   */
  async createIvrMenu(
    data: Omit<PbxIvrMenu, 'id' | 'createdAt'>, 
    options: Omit<PbxIvrMenuOption, 'id' | 'ivrMenuId'>[]
  ): Promise<PbxIvrMenu> {
    // Insert the IVR menu
    const [ivrMenu] = await db.insert(pbxIvrMenus).values(data).returning();
    
    // Insert the options
    if (options.length > 0) {
      await db.insert(pbxIvrMenuOptions).values(
        options.map(option => ({
          ...option,
          ivrMenuId: ivrMenu.id
        }))
      );
    }
    
    logger.info(`Created new IVR menu: ${ivrMenu.name} for tenant ${ivrMenu.tenantId}`);
    return ivrMenu;
  }
  
  /**
   * Add a call log entry
   */
  async addCallLog(data: Omit<PbxCallLog, 'id'>): Promise<PbxCallLog> {
    const [callLog] = await db.insert(pbxCallLogs).values(data).returning();
    logger.info(`Added call log for tenant ${callLog.tenantId}`);
    return callLog;
  }
  
  /**
   * Get customer's call logs for a specific period
   */
  async getCallLogsByCustomerId(customerId: number, startDate: Date, endDate: Date): Promise<PbxCallLog[]> {
    // Get all tenants for this customer
    const tenants = await this.getTenantsByCustomerId(customerId);
    const tenantIds = tenants.map(t => t.id);
    
    if (tenantIds.length === 0) return [];
    
    // Get call logs for these tenants using SQL for advanced filtering
    return db.select().from(pbxCallLogs)
      .where(and(
        // Use raw SQL with placeholders for complex filtering
        sql`${pbxCallLogs.tenantId} IN (${sql.join(tenantIds)})`,
        sql`${pbxCallLogs.startTime} >= ${startDate}`,
        sql`${pbxCallLogs.startTime} <= ${endDate}`
      ));
  }
  
  /**
   * Run a health check on the FreeSWITCH connection
   */
  healthCheck(): { connected: boolean, tenants: number, extensions: number } {
    return {
      connected: this.connected,
      tenants: this.tenants.size,
      extensions: this.extensions.size
    };
  }
}

export const pbxService = new PbxService();