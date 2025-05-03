import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { Loader2, ArrowUpRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('revenue');

  // Revenue data query
  const { 
    data: revenueData, 
    isLoading: revenueLoading,
    refetch: refetchRevenue
  } = useQuery({
    queryKey: ['/api/analytics/revenue', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/revenue?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      return res.json();
    },
  });

  // Customer growth data query
  const { 
    data: customerGrowthData, 
    isLoading: customerGrowthLoading,
    refetch: refetchCustomerGrowth
  } = useQuery({
    queryKey: ['/api/analytics/customer-growth', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/customer-growth?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch customer growth data');
      return res.json();
    },
  });

  // Package distribution data query
  const { 
    data: packageDistributionData, 
    isLoading: packageDistributionLoading,
    refetch: refetchPackageDistribution
  } = useQuery({
    queryKey: ['/api/analytics/package-distribution'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/package-distribution');
      if (!res.ok) throw new Error('Failed to fetch package distribution data');
      return res.json();
    },
  });

  // Bandwidth trends data query
  const { 
    data: bandwidthTrendsData, 
    isLoading: bandwidthTrendsLoading,
    refetch: refetchBandwidthTrends
  } = useQuery({
    queryKey: ['/api/analytics/bandwidth-trends', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/bandwidth-trends?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch bandwidth trends data');
      return res.json();
    },
  });

  // Service uptime data query
  const { 
    data: serviceUptimeData, 
    isLoading: serviceUptimeLoading,
    refetch: refetchServiceUptime
  } = useQuery({
    queryKey: ['/api/analytics/service-uptime'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/service-uptime');
      if (!res.ok) throw new Error('Failed to fetch service uptime data');
      return res.json();
    },
  });

  // RADIUS stats data query
  const { 
    data: radiusStatsData, 
    isLoading: radiusStatsLoading,
    refetch: refetchRadiusStats
  } = useQuery({
    queryKey: ['/api/analytics/radius-stats', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/radius-stats?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch RADIUS stats data');
      return res.json();
    },
  });

  // Ticket stats data query
  const { 
    data: ticketStatsData, 
    isLoading: ticketStatsLoading,
    refetch: refetchTicketStats
  } = useQuery({
    queryKey: ['/api/analytics/ticket-stats', dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/ticket-stats?dateRange=${dateRange}`);
      if (!res.ok) throw new Error('Failed to fetch ticket stats data');
      return res.json();
    },
  });

  // Regional distribution data query
  const { 
    data: regionalDistributionData, 
    isLoading: regionalDistributionLoading,
    refetch: refetchRegionalDistribution
  } = useQuery({
    queryKey: ['/api/analytics/regional-distribution'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/regional-distribution');
      if (!res.ok) throw new Error('Failed to fetch regional distribution data');
      return res.json();
    },
  });

  // Helper function to format date labels
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM dd');
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format data size
  const formatDataSize = (gigabytes: number) => {
    return `${gigabytes.toFixed(1)} GB`;
  };

  const handleRefreshData = () => {
    // Refresh all data based on active tab
    switch (activeTab) {
      case 'revenue':
        refetchRevenue();
        break;
      case 'customers':
        refetchCustomerGrowth();
        refetchPackageDistribution();
        refetchRegionalDistribution();
        break;
      case 'network':
        refetchBandwidthTrends();
        refetchServiceUptime();
        break;
      case 'operations':
        refetchRadiusStats();
        refetchTicketStats();
        break;
      default:
        // Refresh all data
        refetchRevenue();
        refetchCustomerGrowth();
        refetchPackageDistribution();
        refetchBandwidthTrends();
        refetchServiceUptime();
        refetchRadiusStats();
        refetchTicketStats();
        refetchRegionalDistribution();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-500 mt-1">
            Comprehensive insights into your ISP business performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefreshData} 
            variant="outline" 
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="revenue" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="revenue">Financial Analytics</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="network">Network Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations Analytics</TabsTrigger>
        </TabsList>

        {/* Financial Analytics */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue & Profit Trends</CardTitle>
                <CardDescription>
                  Financial performance over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {revenueLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value as number), '']}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Expenses"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue</CardTitle>
                <CardDescription>
                  Recurring revenue by package type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {packageDistributionLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={packageDistributionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill="#8b5cf6" 
                        name="Customers" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>
                  Projected revenue for the next quarter
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="bg-purple-100 p-4 rounded-full mb-4">
                    <ArrowUpRight className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(3450000)}
                  </h3>
                  <p className="text-green-600 font-medium">
                    +12.8% vs Previous Quarter
                  </p>
                  <p className="text-gray-500 mt-4 max-w-xs">
                    Based on current growth rates and seasonal patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customers">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>
                  New and total customers over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {customerGrowthLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={customerGrowthData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalCustomers"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Total Customers"
                      />
                      <Line
                        type="monotone"
                        dataKey="newCustomers"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="New Customers"
                      />
                      <Line
                        type="monotone"
                        dataKey="churnedCustomers"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="Churned Customers"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Distribution</CardTitle>
                <CardDescription>
                  Customers by internet package
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {packageDistributionLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={packageDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          {packageDistributionData?.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>
                  Customer distribution by region
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {regionalDistributionLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalDistributionData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="customers" 
                        fill="#8b5cf6" 
                        name="Customers" 
                        radius={[0, 4, 4, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Retention</CardTitle>
                <CardDescription>
                  Customer retention metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div>
                    <p className="text-gray-500 text-sm">Average Customer Lifetime</p>
                    <h3 className="text-2xl font-bold">36.4 Months</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Monthly Churn Rate</p>
                    <h3 className="text-2xl font-bold">1.7%</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Customer Satisfaction</p>
                    <h3 className="text-2xl font-bold">4.6/5</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Network Analytics */}
        <TabsContent value="network">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Bandwidth Usage Trends</CardTitle>
                <CardDescription>
                  Network bandwidth usage over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {bandwidthTrendsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bandwidthTrendsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatDataSize(value as number), '']}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="download"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Download (GB)"
                      />
                      <Line
                        type="monotone"
                        dataKey="upload"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Upload (GB)"
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Total (GB)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Uptime</CardTitle>
                <CardDescription>
                  Uptime performance by service
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {serviceUptimeLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={serviceUptimeData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        domain={[99.8, 100]} 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Uptime']}
                      />
                      <Bar 
                        dataKey="uptime" 
                        fill="#10B981" 
                        name="Uptime" 
                        radius={[0, 4, 4, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Health</CardTitle>
                <CardDescription>
                  Current network performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div>
                    <p className="text-gray-500 text-sm">Average Latency</p>
                    <h3 className="text-2xl font-bold">12.4 ms</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Packet Loss</p>
                    <h3 className="text-2xl font-bold">0.08%</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Network Jitter</p>
                    <h3 className="text-2xl font-bold">2.1 ms</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Active Network Devices</p>
                    <h3 className="text-2xl font-bold">142</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Analytics */}
        <TabsContent value="operations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>RADIUS Authentication Stats</CardTitle>
                <CardDescription>
                  Authentication activity over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {radiusStatsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={radiusStatsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="authentications"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Authentications"
                      />
                      <Line
                        type="monotone"
                        dataKey="authFailed"
                        stroke="#EF4444"
                        strokeWidth={2}
                        name="Failed Authentications"
                      />
                      <Line
                        type="monotone"
                        dataKey="uniqueUsers"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Unique Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Support Ticket Activity</CardTitle>
                <CardDescription>
                  Support tickets opened and closed
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {ticketStatsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={ticketStatsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="opened"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Tickets Opened"
                      />
                      <Line
                        type="monotone"
                        dataKey="closed"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Tickets Closed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Response Times</CardTitle>
                <CardDescription>
                  Ticket response time in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {ticketStatsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={ticketStatsData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        interval={dateRange === '7days' ? 0 : 'preserveEnd'} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} minutes`, 'Response Time']}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#EC4899"
                        strokeWidth={2}
                        name="Response Time (min)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations Summary</CardTitle>
                <CardDescription>
                  Key operational metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div>
                    <p className="text-gray-500 text-sm">Open Support Tickets</p>
                    <h3 className="text-2xl font-bold">32</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Ticket Resolution Rate</p>
                    <h3 className="text-2xl font-bold">94.2%</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">PBX Uptime</p>
                    <h3 className="text-2xl font-bold">99.95%</h3>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Active Support Agents</p>
                    <h3 className="text-2xl font-bold">8</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}