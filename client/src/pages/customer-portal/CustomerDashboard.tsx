import { useQuery } from "@tanstack/react-query";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Redirect } from "wouter";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CircleUser, 
  BarChart4, 
  Receipt, 
  LifeBuoy, 
  Settings, 
  FileText, 
  Phone,
  Download,
  Upload,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

// Usage Widget
const UsageWidget = () => {
  const { data: usage, isLoading } = useQuery({
    queryKey: ["/api/customer/usage"],
  });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Data Usage</CardTitle>
          <CardDescription>Your current billing period usage</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Default data if none returned
  const usageData = usage || {
    downloadedGB: 0,
    uploadedGB: 0,
    totalGB: 0,
    limit: 500,
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
  };

  const downloadPercent = Math.min(100, (usageData.downloadedGB / usageData.limit) * 100);
  const uploadPercent = Math.min(100, (usageData.uploadedGB / usageData.limit) * 100);
  const totalPercent = Math.min(100, (usageData.totalGB / usageData.limit) * 100);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Data Usage</CardTitle>
        <CardDescription>
          Your current billing period: {new Date(usageData.periodStart).toLocaleDateString()} to{" "}
          {new Date(usageData.periodEnd).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Download</span>
              </div>
              <span className="text-sm font-medium">{usageData.downloadedGB.toFixed(1)} GB</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${downloadPercent}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Upload</span>
              </div>
              <span className="text-sm font-medium">{usageData.uploadedGB.toFixed(1)} GB</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Usage</span>
              </div>
              <span className="text-sm font-medium">{usageData.totalGB.toFixed(1)} GB of {usageData.limit} GB</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500" 
                style={{ width: `${totalPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        <Button variant="outline" className="w-full">View Detailed Usage</Button>
      </CardContent>
    </Card>
  );
};

// Billing Widget
const BillingWidget = () => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/customer/billing"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>Your latest invoices</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Default data if none returned
  const billingData = invoices || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Your latest invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {billingData.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {billingData.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">#{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">R{invoice.amount.toFixed(2)}</p>
                  <p className={`text-sm ${invoice.status === 'paid' ? 'text-green-500' : 'text-amber-500'}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="w-full">View All Invoices</Button>
      </CardContent>
    </Card>
  );
};

// Plan Widget
const PlanWidget = () => {
  const { data: plan, isLoading } = useQuery({
    queryKey: ["/api/customer/plan"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Plan</CardTitle>
          <CardDescription>Your current subscription</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Default data if none returned
  const planData = plan || {
    name: "No active plan",
    description: "Please contact support",
    downloadSpeed: 0,
    uploadSpeed: 0,
    dataLimit: 0,
    price: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Plan</CardTitle>
        <CardDescription>Your current subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-purple-700">{planData.name}</h3>
          <p className="text-sm text-gray-500">{planData.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Download Speed</span>
            <span className="font-medium">{planData.downloadSpeed} Mbps</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Upload Speed</span>
            <span className="font-medium">{planData.uploadSpeed} Mbps</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Data Limit</span>
            <span className="font-medium">{planData.dataLimit} GB</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Monthly Price</span>
            <span className="font-bold text-lg">R{planData.price.toFixed(2)}</span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full">Upgrade Plan</Button>
      </CardContent>
    </Card>
  );
};

// Tickets Widget
const TicketsWidget = () => {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["/api/customer/tickets"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Your recent support requests</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Default data if none returned
  const ticketsData = tickets || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Your recent support requests</CardDescription>
        </div>
        <Button size="sm" className="bg-purple-700 hover:bg-purple-800">New Ticket</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticketsData.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No active tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ticketsData.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-start justify-between py-2">
                <div>
                  <p className="font-medium line-clamp-1">{ticket.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      ticket.status === 'open' ? 'bg-green-500' : 
                      ticket.status === 'pending' ? 'bg-amber-500' : 'bg-gray-500'
                    }`}></span>
                    <p className="text-xs text-gray-500">
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)} • 
                      #{ticket.id} • 
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="w-full">View All Tickets</Button>
      </CardContent>
    </Card>
  );
};

// Recent PBX Calls Widget
const PbxCallsWidget = () => {
  const { data: pbx, isLoading } = useQuery({
    queryKey: ["/api/customer/pbx"],
  });

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>Your PBX call history</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // Default data if no PBX service
  if (!pbx || pbx.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Telephone Services</CardTitle>
          <CardDescription>No active PBX services</CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <div className="text-center space-y-3">
            <Phone className="h-12 w-12 mx-auto text-gray-300" />
            <div>
              <p className="text-sm text-gray-500">You don't have any active telephone services.</p>
              <p className="text-sm text-gray-500">Contact support to add PBX services to your account.</p>
            </div>
            <Button variant="outline" className="mt-2">Contact Support</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock data for calls - would be real data in a proper implementation
  const recentCalls = [
    { id: 1, direction: "inbound", from: "+27821234567", to: "Ext 101", duration: "2m 14s", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 2, direction: "outbound", from: "Ext 102", to: "+27821234444", duration: "5m 23s", timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 3, direction: "inbound", from: "+27831234567", to: "Ext 101", duration: "1m 05s", timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Calls</CardTitle>
        <CardDescription>Your PBX call history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${call.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <Phone className={`h-4 w-4 ${call.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{call.direction === 'inbound' ? call.from : call.to}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        call.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {call.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(call.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{call.duration}</p>
                  <p className="text-xs text-gray-500">
                    {call.direction === 'inbound' ? `To: ${call.to}` : `From: ${call.from}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full">View Call History</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function CustomerDashboard() {
  const { customer, isLoading, logoutMutation } = useCustomerAuth();
  
  // Redirect if not logged in
  if (!isLoading && !customer) {
    return <Redirect to="/customer/login" />;
  }

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-purple-800">Netwise</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-medium">{customer?.fullName || customer?.username}</p>
                <p className="text-xs text-gray-500">{customer?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CircleUser className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="dashboard">
          <div className="border-b">
            <TabsList className="w-full justify-start mb-0 bg-transparent">
              <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-700 data-[state=active]:bg-transparent rounded-none">Dashboard</TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-700 data-[state=active]:bg-transparent rounded-none">Usage</TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-700 data-[state=active]:bg-transparent rounded-none">Billing</TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-700 data-[state=active]:bg-transparent rounded-none">Support</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-purple-700 data-[state=active]:bg-transparent rounded-none">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="pt-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome to your customer portal dashboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <UsageWidget />
                <BillingWidget />
                <PlanWidget />
                <TicketsWidget />
                <PbxCallsWidget />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="pt-6">
            <h1 className="text-2xl font-bold tracking-tight">Usage Statistics</h1>
            <p className="text-gray-500">Detailed usage statistics will be available here.</p>
          </TabsContent>

          <TabsContent value="billing" className="pt-6">
            <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
            <p className="text-gray-500">Manage your billing information and payment methods.</p>
          </TabsContent>

          <TabsContent value="support" className="pt-6">
            <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-gray-500">View and create support tickets.</p>
          </TabsContent>

          <TabsContent value="settings" className="pt-6">
            <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-gray-500">Manage your account preferences and settings.</p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}