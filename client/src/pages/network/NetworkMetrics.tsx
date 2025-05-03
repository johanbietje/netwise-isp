import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NetworkDevice, NetworkMetric } from '@shared/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertCircle, Activity, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NetworkMetrics() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [metricType, setMetricType] = useState<string>('cpu');
  
  // Fetch all devices
  const { data: devices, isLoading: isLoadingDevices, isError: isDevicesError } = useQuery<NetworkDevice[]>({
    queryKey: ['/api/network/devices'],
    staleTime: 60000, // 1 minute
  });
  
  // Fetch metrics for the selected device
  const { data: metrics, isLoading: isLoadingMetrics, isError: isMetricsError, refetch } = useQuery<NetworkMetric[]>({
    queryKey: ['/api/network/metrics', selectedDeviceId],
    staleTime: 30000, // 30 seconds
    enabled: !!selectedDeviceId, // Only fetch if a device is selected
  });
  
  // Transform metrics data for charts
  const prepareChartData = () => {
    if (!metrics || metrics.length === 0) return [];
    
    // Sort metrics by timestamp
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    return sortedMetrics.map(metric => {
      const timestamp = new Date(metric.timestamp);
      return {
        name: `${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}`,
        timestamp: timestamp.toISOString(),
        cpuUsage: metric.cpuUsage || 0,
        memoryUsage: metric.memoryUsage || 0,
        bandwidth: metric.bandwidth || 0,
        temperature: metric.temperature || 0,
      };
    });
  };
  
  const chartData = prepareChartData();
  
  if (isLoadingDevices) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }
  
  if (isDevicesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load network devices. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-72">
          <Select
            value={selectedDeviceId}
            onValueChange={setSelectedDeviceId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a device" />
            </SelectTrigger>
            <SelectContent>
              {devices?.map(device => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.name} ({device.deviceType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedDeviceId && (
          <div className="flex space-x-2">
            <Tabs defaultValue="cpu" value={metricType} onValueChange={setMetricType}>
              <TabsList>
                <TabsTrigger value="cpu">CPU</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="bandwidth">Bandwidth</TabsTrigger>
                <TabsTrigger value="temperature">Temp</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoadingMetrics}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>
      
      {selectedDeviceId ? (
        <>
          {isLoadingMetrics ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          ) : isMetricsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load metrics for the selected device.
                <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : metrics && metrics.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {metricType === 'cpu' && 'CPU Usage Over Time'}
                    {metricType === 'memory' && 'Memory Usage Over Time'}
                    {metricType === 'bandwidth' && 'Bandwidth Utilization'}
                    {metricType === 'temperature' && 'Temperature Over Time'}
                  </CardTitle>
                  <CardDescription>
                    {metricType === 'cpu' && 'CPU utilization percentage over time'}
                    {metricType === 'memory' && 'Memory usage percentage over time'}
                    {metricType === 'bandwidth' && 'Network bandwidth in Mbps'}
                    {metricType === 'temperature' && 'Device temperature in celsius'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis 
                          label={{ 
                            value: metricType === 'cpu' || metricType === 'memory' ? 
                              '%' : metricType === 'bandwidth' ? 
                              'Mbps' : '°C', 
                            angle: -90, 
                            position: 'insideLeft' 
                          }} 
                        />
                        <Tooltip />
                        <Legend />
                        {metricType === 'cpu' && (
                          <Line 
                            type="monotone" 
                            dataKey="cpuUsage" 
                            name="CPU Usage" 
                            stroke="#8b5cf6" 
                            activeDot={{ r: 8 }} 
                          />
                        )}
                        {metricType === 'memory' && (
                          <Line 
                            type="monotone" 
                            dataKey="memoryUsage" 
                            name="Memory Usage" 
                            stroke="#3b82f6" 
                            activeDot={{ r: 8 }} 
                          />
                        )}
                        {metricType === 'bandwidth' && (
                          <Line 
                            type="monotone" 
                            dataKey="bandwidth" 
                            name="Bandwidth" 
                            stroke="#10b981" 
                            activeDot={{ r: 8 }} 
                          />
                        )}
                        {metricType === 'temperature' && (
                          <Line 
                            type="monotone" 
                            dataKey="temperature" 
                            name="Temperature" 
                            stroke="#ef4444" 
                            activeDot={{ r: 8 }} 
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <MetricCard 
                  title="CPU Usage" 
                  value={metrics[metrics.length - 1]?.cpuUsage || 0} 
                  unit="%" 
                  icon={<Cpu className="h-4 w-4" />}
                  colorClass={getUtilizationColorClass(metrics[metrics.length - 1]?.cpuUsage || 0)}
                />
                <MetricCard 
                  title="Memory Usage" 
                  value={metrics[metrics.length - 1]?.memoryUsage || 0} 
                  unit="%" 
                  icon={<Activity className="h-4 w-4" />}
                  colorClass={getUtilizationColorClass(metrics[metrics.length - 1]?.memoryUsage || 0)}
                />
                <MetricCard 
                  title="Bandwidth" 
                  value={metrics[metrics.length - 1]?.bandwidth || 0} 
                  unit="Mbps" 
                  icon={<Activity className="h-4 w-4" />}
                  colorClass="text-green-500"
                />
                <MetricCard 
                  title="Temperature" 
                  value={metrics[metrics.length - 1]?.temperature || 0} 
                  unit="°C" 
                  icon={<Activity className="h-4 w-4" />}
                  colorClass={getTemperatureColorClass(metrics[metrics.length - 1]?.temperature || 0)}
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-semibold">No metrics available</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no metrics available for this device yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-semibold">Select a device</h3>
              <p className="text-sm text-muted-foreground">
                Please select a device to view its performance metrics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric cards
function MetricCard({ title, value, unit, icon, colorClass }: { 
  title: string; 
  value: number; 
  unit: string; 
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className={`text-2xl font-bold ${colorClass}`}>
              {value.toFixed(1)}{unit}
            </h3>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to determine color based on utilization percentage
function getUtilizationColorClass(value: number): string {
  if (value < 50) return 'text-green-500';
  if (value < 80) return 'text-yellow-500';
  return 'text-red-500';
}

// Helper function to determine color based on temperature
function getTemperatureColorClass(value: number): string {
  if (value < 50) return 'text-green-500';
  if (value < 70) return 'text-yellow-500';
  return 'text-red-500';
}

export default NetworkMetrics;