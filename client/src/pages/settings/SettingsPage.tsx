import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Settings, 
  Bell, 
  Lock, 
  Server, 
  Shield, 
  Save, 
  RefreshCw,
  Upload,
  Database,
  Mail,
  CreditCard,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSave = () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been successfully saved.',
      });
    }, 1000);
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="radius">
              <Server className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">RADIUS</span>
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Configure general system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="RadiusISP" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="admin-email">Administrative Email</Label>
                  <Input id="admin-email" defaultValue={user?.email || 'admin@radiusisp.com'} />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="UTC"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Temporarily disable customer logins for maintenance
                    </p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive system alerts via email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="customer-signup">New Customer Signup</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when a new customer registers
                    </p>
                  </div>
                  <Switch id="customer-signup" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ticket-notifications">New Support Tickets</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when a new support ticket is created
                    </p>
                  </div>
                  <Switch id="ticket-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="billing-notifications">Billing Events</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about important billing events
                    </p>
                  </div>
                  <Switch id="billing-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="radius-auth-fail">RADIUS Auth Failures</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about repeated authentication failures
                    </p>
                  </div>
                  <Switch id="radius-auth-fail" defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security options for your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">
                      Require two-factor authentication for all admin users
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <select
                    id="password-policy"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="medium"
                  >
                    <option value="low">Basic (min 6 chars)</option>
                    <option value="medium">Medium (min 8 chars, mixed case)</option>
                    <option value="high">Strong (min 10 chars, mixed case, numbers, symbols)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ip-restriction">IP Restriction</Label>
                    <p className="text-sm text-gray-500">
                      Restrict admin access to specific IP addresses
                    </p>
                  </div>
                  <Switch id="ip-restriction" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
                  <Input id="allowed-ips" placeholder="e.g., 192.168.1.1, 10.0.0.1" />
                  <p className="text-sm text-gray-500">
                    Comma-separated list of allowed IP addresses
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="radius" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>RADIUS Server Configuration</CardTitle>
                <CardDescription>
                  Configure RADIUS server settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="auth-port">Authentication Port</Label>
                  <Input id="auth-port" type="number" defaultValue="1812" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="acct-port">Accounting Port</Label>
                  <Input id="acct-port" type="number" defaultValue="1813" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="default-session-timeout">Default Session Timeout (seconds)</Label>
                  <Input id="default-session-timeout" type="number" defaultValue="86400" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="acct-interval">Accounting Interim Interval (seconds)</Label>
                  <Input id="acct-interval" type="number" defaultValue="300" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="coa-support">CoA Support</Label>
                    <p className="text-sm text-gray-500">
                      Enable Change of Authorization support
                    </p>
                  </div>
                  <Switch id="coa-support" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="log-auth">Log Authentication Attempts</Label>
                    <p className="text-sm text-gray-500">
                      Store detailed logs of all authentication attempts
                    </p>
                  </div>
                  <Switch id="log-auth" defaultChecked />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart RADIUS Server
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
                <CardDescription>
                  Configure billing options and payment gateways
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="ZAR"
                  >
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="billing-cycle">Default Billing Cycle</Label>
                  <select
                    id="billing-cycle"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue="monthly"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="semiannual">Semi-Annual</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input id="tax-rate" type="number" step="0.01" defaultValue="7.5" />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="invoice-prefix">Invoice Number Prefix</Label>
                  <Input id="invoice-prefix" defaultValue="INV-" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-invoice">Automatic Invoicing</Label>
                    <p className="text-sm text-gray-500">
                      Automatically generate invoices based on billing cycle
                    </p>
                  </div>
                  <Switch id="auto-invoice" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-suspend">Auto-Suspend Overdue Accounts</Label>
                    <p className="text-sm text-gray-500">
                      Automatically suspend accounts with overdue payments
                    </p>
                  </div>
                  <Switch id="auto-suspend" defaultChecked />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="grace-period">Grace Period (days)</Label>
                  <Input id="grace-period" type="number" defaultValue="7" />
                  <p className="text-sm text-gray-500">
                    Days after due date before account is suspended
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
