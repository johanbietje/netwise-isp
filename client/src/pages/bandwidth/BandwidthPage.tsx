import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useQuery } from '@tanstack/react-query';
import { BandwidthUsage, TopCustomer } from '@shared/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function BandwidthPage() {
  const [timeRange, setTimeRange] = useState('7');
  const [chartType, setChartType] = useState('line');
  
  // Fetch bandwidth usage data
  const { data: bandwidthData, isLoading: isLoadingBandwidth } = useQuery<BandwidthUsage[]>({
    queryKey: ['/api/dashboard/bandwidth', timeRange],
    retry: false
  });
  
  // Fetch top customers data
  const { data: topCustomers, isLoading: isLoadingCustomers } = useQuery<TopCustomer[]>({
    queryKey: ['/api/dashboard/top-customers'],
    retry: false
  });
  
  // Format date labels for display
  const formatData = (data: BandwidthUsage[] | undefined) => {
    if (!data) return [];
    
    return data.map(item => {
      const date = new Date(item.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
      
      return {
        ...item,
        formattedDate,
        total: item.download + item.upload
      };
    });
  };
  
  const formattedData = formatData(bandwidthData);

  // Transform data for the pie chart
  const pieData = topCustomers?.map(customer => ({
    name: customer.fullName,
    value: customer.usage
  })) || [];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Bandwidth Management</h1>
        
        <Tabs defaultValue="usage" className="mt-6">
          <TabsList>
            <TabsTrigger value="usage">Usage Analysis</TabsTrigger>
            <TabsTrigger value="distribution">Usage Distribution</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="usage" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Bandwidth Usage Over Time</CardTitle>
                <div className="flex items-center space-x-4">
                  <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={chartType}
                    onValueChange={setChartType}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="stacked">Stacked Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isLoadingBandwidth ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'line' ? (
                        <LineChart
                          data={formattedData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="formattedDate" />
                          <YAxis yAxisId="left" orientation="left" label={{ value: 'TB', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="download" name="Download (TB)" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                          <Line yAxisId="left" type="monotone" dataKey="upload" name="Upload (TB)" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                          <Line yAxisId="left" type="monotone" dataKey="total" name="Total (TB)" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                      ) : chartType === 'bar' ? (
                        <BarChart
                          data={formattedData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="formattedDate" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="download" name="Download (TB)" fill="#3B82F6" />
                          <Bar dataKey="upload" name="Upload (TB)" fill="#10B981" />
                        </BarChart>
                      ) : (
                        <BarChart
                          data={formattedData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="formattedDate" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="download" name="Download (TB)" stackId="a" fill="#3B82F6" />
                          <Bar dataKey="upload" name="Upload (TB)" stackId="a" fill="#10B981" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Usage Distribution by Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {isLoadingCustomers ? (
                    <div className="w-full h-full flex justify-center items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} TB`, 'Usage']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10 text-gray-500">
                  <p>Trend analysis will be available in a future update.</p>
                  <p className="mt-2">This feature will provide predictive bandwidth usage based on historical data.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
