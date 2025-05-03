import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NetworkTopology } from './NetworkTopology';
import { NetworkDevices } from './NetworkDevices';
import { NetworkMetrics } from './NetworkMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<string>('topology');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Network Monitoring</h1>
      <p className="text-muted-foreground">
        Monitor your network infrastructure, visualize topology, and analyze device metrics.
      </p>

      <Tabs defaultValue="topology" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="topology">Network Topology</TabsTrigger>
          <TabsTrigger value="devices">Network Devices</TabsTrigger>
          <TabsTrigger value="metrics">Device Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Topology</CardTitle>
              <CardDescription>
                Interactive visualization of your network topology. Drag nodes to reposition them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkTopology />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Devices</CardTitle>
              <CardDescription>
                Manage your network devices and their configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkDevices />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Metrics</CardTitle>
              <CardDescription>
                Monitor and analyze device performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkMetrics />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NetworkPage;