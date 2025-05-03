import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Customer, CustomerStatus } from "@shared/types";
import { Loader2, Edit, Wifi, WifiOff, Clock, Upload, Download, Activity } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id;
  const [activeTab, setActiveTab] = useState("overview");

  // Customer data
  const { data: customer, isLoading: isCustomerLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${id}`],
  });

  // RADIUS status
  const { 
    data: radiusStatus, 
    isLoading: isRadiusStatusLoading,
    refetch: refetchRadiusStatus
  } = useQuery({
    queryKey: [`/api/radius/customers/${id}`],
    // Refresh every 30 seconds
    refetchInterval: 30000
  });

  useEffect(() => {
    // Refresh RADIUS status when tab changes to connection
    if (activeTab === "connection") {
      refetchRadiusStatus();
    }
  }, [activeTab, refetchRadiusStatus]);

  if (isCustomerLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold mb-2">Customer Not Found</h2>
        <p className="text-muted-foreground mb-4">The customer you are looking for does not exist or has been removed.</p>
        <Link href="/customers">
          <Button>Return to Customers</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case CustomerStatus.ACTIVE:
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case CustomerStatus.SUSPENDED:
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
      case CustomerStatus.TERMINATED:
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{customer.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">@{customer.username}</span>
            <Badge variant="outline" className={getStatusColor(customer.status)}>
              {customer.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/customers/${id}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Customer
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{customer.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{customer.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{customer.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internet Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.plan ? (
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <h3 className="text-xl font-bold text-purple-600">{customer.plan.name}</h3>
                      <p className="text-2xl font-bold">${customer.plan.price.toFixed(2)}<span className="text-sm text-muted-foreground">/month</span></p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Download Speed</p>
                        <p className="font-medium">{customer.plan.downloadSpeed} Mbps</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Upload Speed</p>
                        <p className="font-medium">{customer.plan.uploadSpeed} Mbps</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data Limit</p>
                        <p className="font-medium">
                          {customer.plan.dataLimit 
                            ? `${(customer.plan.dataLimit / 1024).toFixed(0)} GB` 
                            : "Unlimited"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">No plan assigned</p>
                    <Link href={`/customers/${id}/edit`}>
                      <Button variant="link" className="mt-2">Assign a plan</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connection" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Current RADIUS connection information</CardDescription>
              </CardHeader>
              <CardContent>
                {isRadiusStatusLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center justify-center py-6">
                      {radiusStatus?.online ? (
                        <>
                          <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full mb-3">
                            <Wifi className="h-8 w-8 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Online</h3>
                          <p className="text-sm text-muted-foreground">Customer is currently connected</p>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                            <WifiOff className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Offline</h3>
                          <p className="text-sm text-muted-foreground">Customer is not connected</p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Last Session</span>
                        </div>
                        <span className="text-sm font-medium">
                          {radiusStatus?.lastSession 
                            ? formatRelativeTime(radiusStatus.lastSession)
                            : "No recent sessions"}
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => refetchRadiusStatus()}
                    >
                      Refresh Status
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>Current bandwidth consumption</CardDescription>
              </CardHeader>
              <CardContent>
                {isRadiusStatusLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Download</span>
                        </div>
                        <span className="text-sm font-medium">
                          {radiusStatus?.usageThisMonth?.download || 0} GB
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Upload</span>
                        </div>
                        <span className="text-sm font-medium">
                          {radiusStatus?.usageThisMonth?.upload || 0} GB
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Total</span>
                        </div>
                        <span className="text-sm font-bold">
                          {radiusStatus?.usageThisMonth?.total || 0} GB
                        </span>
                      </div>
                    </div>
                    
                    {customer.plan?.dataLimit && (
                      <div className="pt-4 pb-2">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>Usage</span>
                          <span>
                            {radiusStatus?.usageThisMonth?.total || 0} GB of {(customer.plan.dataLimit / 1024).toFixed(0)} GB
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                            style={{ 
                              width: `${Math.min(
                                ((radiusStatus?.usageThisMonth?.total || 0) / (customer.plan.dataLimit / 1024)) * 100,
                                100
                              )}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Recent Authentication</CardTitle>
                <CardDescription>Last 5 RADIUS authentication attempts</CardDescription>
              </CardHeader>
              <CardContent>
                {isRadiusStatusLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : radiusStatus?.recentAuths?.length ? (
                  <div className="space-y-4">
                    {radiusStatus.recentAuths.map((auth: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 border-b pb-2 last:border-none">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            auth.status === 'accept' ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{auth.clientIp || "Unknown device"}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(auth.timestamp)}</p>
                        </div>
                        <Badge className={auth.status === 'accept' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }>
                          {auth.status === 'accept' ? 'Accepted' : 'Rejected'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-muted-foreground">No recent authentication attempts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="billing" className="mt-6">
          <div className="rounded-lg border shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Billing & Invoices</h3>
            <p className="text-muted-foreground mb-4">This feature is coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="tickets" className="mt-6">
          <div className="rounded-lg border shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Support Tickets</h3>
            <p className="text-muted-foreground mb-4">This feature is coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="mt-6">
          <div className="rounded-lg border shadow-sm p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Customer Activity</h3>
            <p className="text-muted-foreground mb-4">This feature is coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}