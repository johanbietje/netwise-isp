import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Phone, 
  Server, 
  UserPlus, 
  Network, 
  Users, 
  Activity, 
  AlertCircle, 
  Check,
  Headphones,
  Hash,
  FileAudio,
  BarChart,
  Globe,
  GitBranch
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PbxTenants } from './PbxTenants';
import { PbxExtensions } from './PbxExtensions';
import { PbxCallRoutes } from './PbxCallRoutes';
import { PbxRingGroups } from './PbxRingGroups';
import { PbxIvrMenus } from './PbxIvrMenus';
import { PbxCallLogs } from './PbxCallLogs';
import { PbxRealTimeDashboard } from './PbxRealTimeDashboard';
import { PbxConferences } from './PbxConferences';
import { PbxIvrBuilder } from './PbxIvrBuilder';
import { PbxCallRecordings } from './PbxCallRecordings';
import { PbxGateways } from './PbxGateways';
import { PbxCallFlows } from './PbxCallFlows';

export function PbxPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check PBX health status
  const { data: healthStatus, isLoading, error } = useQuery({
    queryKey: ['/api/pbx/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">PBX System</h1>
          <p className="text-gray-600 mt-1">
            Multi-tenant PBX system powered by FreeSWITCH
          </p>
        </div>
        
        {/* Health status display */}
        {isLoading ? (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Checking status...
          </Badge>
        ) : error ? (
          <Badge variant="destructive">Service error</Badge>
        ) : healthStatus?.connected ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
            <Check className="h-3 w-3 mr-1" /> PBX Service Online
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" /> Service Disconnected
          </Badge>
        )}
      </div>

      {!healthStatus?.connected && !isLoading && !error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription>
            The PBX service is currently disconnected. FreeSWITCH may be offline or unreachable.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="inline-flex h-auto flex-wrap p-1 rounded-lg">
          <TabsTrigger value="overview" data-value="overview" className="px-3 py-1.5">
            <Server className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="realtime" data-value="realtime" className="px-3 py-1.5">
            <Activity className="h-4 w-4 mr-2" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="tenants" data-value="tenants" className="px-3 py-1.5">
            <Users className="h-4 w-4 mr-2" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="extensions" data-value="extensions" className="px-3 py-1.5">
            <Phone className="h-4 w-4 mr-2" />
            Extensions
          </TabsTrigger>
          <TabsTrigger value="call-routes" data-value="call-routes" className="px-3 py-1.5">
            <Network className="h-4 w-4 mr-2" />
            Call Routes
          </TabsTrigger>
          <TabsTrigger value="gateways" data-value="gateways" className="px-3 py-1.5">
            <Globe className="h-4 w-4 mr-2" />
            SIP Gateways
          </TabsTrigger>
          <TabsTrigger value="call-flows" data-value="call-flows" className="px-3 py-1.5">
            <GitBranch className="h-4 w-4 mr-2" />
            Call Flows
          </TabsTrigger>
          <TabsTrigger value="conferences" data-value="conferences" className="px-3 py-1.5">
            <Headphones className="h-4 w-4 mr-2" />
            Conferences
          </TabsTrigger>
          <TabsTrigger value="ring-groups" data-value="ring-groups" className="px-3 py-1.5">
            <Users className="h-4 w-4 mr-2" />
            Ring Groups
          </TabsTrigger>
          <TabsTrigger value="ivr-menus" data-value="ivr-menus" className="px-3 py-1.5">
            <Hash className="h-4 w-4 mr-2" />
            IVR Menus
          </TabsTrigger>
          <TabsTrigger value="ivr-builder" data-value="ivr-builder" className="px-3 py-1.5">
            <BarChart className="h-4 w-4 mr-2" />
            IVR Builder
          </TabsTrigger>
          <TabsTrigger value="call-logs" data-value="call-logs" className="px-3 py-1.5">
            <Activity className="h-4 w-4 mr-2" />
            Call Logs
          </TabsTrigger>
          <TabsTrigger value="recordings" data-value="recordings" className="px-3 py-1.5">
            <FileAudio className="h-4 w-4 mr-2" />
            Recordings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tenants</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStatus?.tenants || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total PBX tenants
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Extensions</CardTitle>
                <Phone className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStatus?.extensions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered extensions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <Server className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {healthStatus?.connected ? (
                    <>
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <div className="text-lg font-medium">Connected</div>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                      <div className="text-lg font-medium">Disconnected</div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  FreeSWITCH ESL connection status
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>PBX System Architecture</CardTitle>
                <CardDescription>
                  Multi-tenant PBX system overview
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Network className="h-16 w-16 text-purple-300 mx-auto" />
                  <p className="text-muted-foreground">
                    The PBX system is built on FreeSWITCH with multi-tenant support.
                    Each customer can have their own PBX tenant with isolated extensions,
                    call routing, and voice applications.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>
                  Common PBX management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('realtime')}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Real-Time Call Monitor
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('ivr-builder')}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  IVR Flow Builder
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('conferences')}
                >
                  <Headphones className="mr-2 h-4 w-4" />
                  Conference Bridges
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('recordings')}
                >
                  <FileAudio className="mr-2 h-4 w-4" />
                  Call Recordings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('tenants')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage PBX Tenants
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('extensions')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New Extension
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tenants">
          <PbxTenants />
        </TabsContent>
        
        <TabsContent value="extensions">
          <PbxExtensions />
        </TabsContent>
        
        <TabsContent value="call-routes">
          <PbxCallRoutes />
        </TabsContent>
        
        <TabsContent value="ring-groups">
          <PbxRingGroups />
        </TabsContent>
        
        <TabsContent value="ivr-menus">
          <PbxIvrMenus />
        </TabsContent>
        
        <TabsContent value="call-logs">
          <PbxCallLogs />
        </TabsContent>
        
        <TabsContent value="realtime">
          <PbxRealTimeDashboard />
        </TabsContent>
        
        <TabsContent value="conferences">
          <PbxConferences />
        </TabsContent>
        
        <TabsContent value="ivr-builder">
          <PbxIvrBuilder />
        </TabsContent>
        
        <TabsContent value="recordings">
          <PbxCallRecordings />
        </TabsContent>
        
        <TabsContent value="gateways">
          <PbxGateways />
        </TabsContent>
        
        <TabsContent value="call-flows">
          <PbxCallFlows />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PbxPage;