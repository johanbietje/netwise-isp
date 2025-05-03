import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { NetworkDevice, NetworkConnection } from '@shared/schema';
import { AlertCircle, Server, Router, Wifi, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

interface TopologyData {
  nodes: NetworkDevice[];
  links: NetworkConnection[];
}

interface GraphData {
  nodes: Array<NetworkDevice & { color?: string; size?: number }>;
  links: Array<NetworkConnection & { color?: string; value?: number }>;
}

export function NetworkTopology() {
  const { toast } = useToast();
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(600);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Fetch topology data
  const { data, isLoading, isError, refetch } = useQuery<TopologyData>({
    queryKey: ['/api/network/topology'],
    staleTime: 60000, // 1 minute
  });

  // Update device coordinates mutation
  const updateCoordinates = useMutation({
    mutationFn: async ({ id, coordinates }: { id: number; coordinates: { x: number; y: number } }) => {
      return apiRequest(`/api/network/devices/${id}/coordinates`, {
        method: 'PATCH',
        data: { coordinates },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/network/topology'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update device position.',
        variant: 'destructive',
      });
    },
  });

  // Process the data for visualization
  useEffect(() => {
    if (data) {
      const processedData: GraphData = {
        nodes: data.nodes.map(node => {
          const deviceTypeColors: Record<string, string> = {
            router: '#f59e0b', // amber-500
            switch: '#3b82f6', // blue-500
            access_point: '#10b981', // emerald-500
            server: '#6366f1', // indigo-500
            firewall: '#ef4444', // red-500
            default: '#8b5cf6', // purple-500
          };

          const statusColors: Record<string, string> = {
            active: '#22c55e', // green-500
            inactive: '#6b7280', // gray-500
            maintenance: '#eab308', // yellow-500
            default: '#6b7280', // gray-500
          };

          return {
            ...node,
            // Set node color based on status
            color: statusColors[node.status] || statusColors.default,
            // Set node size based on device type
            size: node.deviceType === 'router' ? 18 : 
                 node.deviceType === 'switch' ? 15 : 
                 node.deviceType === 'server' ? 20 : 12,
            // If coordinates are not set, set them to null so the layout engine can position them
            coordinates: node.coordinates && 
                       typeof node.coordinates === 'object' && 
                       'x' in node.coordinates && 
                       'y' in node.coordinates ? 
                       node.coordinates : { x: null, y: null }
          };
        }),
        links: data.links.map(link => {
          const statusColors: Record<string, string> = {
            active: '#22c55e', // green-500
            down: '#ef4444', // red-500
            degraded: '#f59e0b', // amber-500
            default: '#6b7280', // gray-500
          };

          return {
            ...link,
            // Set link color based on status
            color: statusColors[link.status] || statusColors.default,
            // Set link width based on bandwidth
            value: link.bandwidth ? Math.log(link.bandwidth) / 2 : 1,
          };
        }),
      };

      setGraphData(processedData);
    }
  }, [data]);

  // Adjust graph size on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setWidth(width);
        setHeight(Math.max(height, 500)); // Ensure minimum height
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Node drag ended handler - save position to backend
  const handleNodeDragEnd = (node: any) => {
    if (isAdmin && node) {
      updateCoordinates.mutate({
        id: node.id,
        coordinates: {
          x: node.x,
          y: node.y,
        },
      });
    }
  };

  // Create a node label with device details
  const createNodeLabel = (node: any) => {
    return `
      <div style="background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; max-width: 200px;">
        <div style="font-weight: bold; color: white;">${node.name || 'Unknown Device'}</div>
        <div style="font-size: 12px; color: #ccc;">Type: ${node.deviceType || 'Unknown'}</div>
        <div style="font-size: 12px; color: #ccc;">IP: ${node.ipAddress || 'N/A'}</div>
        <div style="font-size: 12px; color: #ccc;">Status: ${node.status || 'Unknown'}</div>
      </div>
    `;
  };

  // Create a link label with connection details
  const createLinkLabel = (link: any) => {
    return `
      <div style="background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; max-width: 200px;">
        <div style="font-weight: bold; color: white;">Connection</div>
        <div style="font-size: 12px; color: #ccc;">Type: ${link.connectionType || 'Unknown'}</div>
        <div style="font-size: 12px; color: #ccc;">Bandwidth: ${link.bandwidth ? link.bandwidth + ' Mbps' : 'N/A'}</div>
        <div style="font-size: 12px; color: #ccc;">Status: ${link.status || 'Unknown'}</div>
        ${link.latency ? `<div style="font-size: 12px; color: #ccc;">Latency: ${link.latency} ms</div>` : ''}
        ${link.packetLoss ? `<div style="font-size: 12px; color: #ccc;">Packet Loss: ${link.packetLoss}%</div>` : ''}
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-10 w-10 text-purple-500 animate-spin" />
        <p className="text-muted-foreground">Loading network topology...</p>
        <div className="w-full max-w-2xl space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load network topology data.
          <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (data && (!data.nodes.length || !data.links.length)) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No network data</AlertTitle>
          <AlertDescription>
            Your network topology is empty. Add network devices and connections to visualize your network.
          </AlertDescription>
        </Alert>
        
        {isAdmin && (
          <div className="flex flex-col gap-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Getting Started</h3>
                  <p className="text-sm text-muted-foreground">
                    To build your network topology, first add network devices and then create connections between them.
                  </p>
                  <Button 
                    onClick={() => {
                      const parentElement = document.querySelector('[data-value="devices"]') as HTMLElement;
                      if (parentElement) {
                        parentElement.click();
                      }
                    }}
                    variant="default"
                    className="mt-2"
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Add Network Devices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center">
            <Check className="h-3 w-3 mr-1" /> Active: {graphData.nodes.filter(n => n.status === 'active').length}
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Maintenance: {graphData.nodes.filter(n => n.status === 'maintenance').length}
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Issues: {graphData.links.filter(l => l.status === 'down' || l.status === 'degraded').length}
          </Badge>
        </div>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="border rounded-md p-6" style={{ height: '70vh' }} ref={containerRef}>
        {graphData.nodes.length > 0 && (
          <div className="w-full h-full overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Network Device List</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {graphData.nodes.map((node) => (
                <div 
                  key={node.id} 
                  className="border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: node.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{node.name}</h3>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: node.color }}
                      title={`Status: ${node.status}`}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Type:</span>
                      {node.deviceType}
                    </div>
                    {node.ipAddress && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">IP:</span>
                        {node.ipAddress}
                      </div>
                    )}
                    {node.location && (
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Location:</span>
                        {node.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <h2 className="text-lg font-semibold mt-8 mb-4">Network Connections</h2>
            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-3 font-medium bg-muted/50 text-sm">
                <div className="col-span-3">Source</div>
                <div className="col-span-3">Destination</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Bandwidth</div>
                <div className="col-span-2">Status</div>
              </div>
              
              {graphData.links.map((link) => {
                const sourceNode = graphData.nodes.find(n => n.id === link.sourceDeviceId);
                const targetNode = graphData.nodes.find(n => n.id === link.targetDeviceId);
                
                return (
                  <div key={link.id} className="grid grid-cols-12 gap-2 p-3 border-t text-sm">
                    <div className="col-span-3">{sourceNode?.name || 'Unknown'}</div>
                    <div className="col-span-3">{targetNode?.name || 'Unknown'}</div>
                    <div className="col-span-2">{link.connectionType}</div>
                    <div className="col-span-2">{link.bandwidth ? `${link.bandwidth} Mbps` : 'N/A'}</div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: link.color }}
                        ></div>
                        {link.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground italic">
        {isAdmin ? 'Admin mode: You can add and manage network devices and connections.' : 'View-only mode: Contact an administrator to update network topology.'}
      </div>
    </div>
  );
}

export default NetworkTopology;