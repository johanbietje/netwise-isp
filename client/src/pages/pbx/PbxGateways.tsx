import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { PbxGateway, PbxTenant } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Network, AlertCircle, ChevronRight, Globe, Plus, RefreshCw, Settings, Wifi } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const gatewayFormSchema = z.object({
  tenantId: z.number().min(1, 'Tenant is required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  host: z.string().min(3, 'Host must be at least 3 characters'),
  port: z.number().min(1, 'Port is required').default(5060),
  username: z.string().optional(),
  password: z.string().optional(),
  transportType: z.enum(['udp', 'tcp', 'tls']).default('udp'),
  registerEnabled: z.boolean().default(false),
  active: z.boolean().default(true),
  description: z.string().optional(),
});

type GatewayFormValues = z.infer<typeof gatewayFormSchema>;

const gatewayRouteFormSchema = z.object({
  gatewayId: z.number().min(1, 'Gateway is required'),
  prefix: z.string().min(1, 'Prefix is required'),
  priority: z.number().min(1, 'Priority is required').default(1),
  prepend: z.string().optional(),
  stripDigits: z.number().min(0, 'Strip digits must be at least 0').default(0),
  active: z.boolean().default(true),
});

type GatewayRouteFormValues = z.infer<typeof gatewayRouteFormSchema>;

export function PbxGateways() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddRouteDialogOpen, setIsAddRouteDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PbxGateway | null>(null);
  
  // Tenant selector
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  
  // Get all tenants
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/pbx/tenants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/pbx/tenants');
      const data = await response.json();
      return data as PbxTenant[] || [];
    },
  });
  
  // Get all PBX gateways or filter by selected tenant
  const {
    data: gateways,
    isLoading,
    isError,
    refetch,
  } = useQuery<PbxGateway[]>({
    queryKey: ['/api/pbx/gateways', selectedTenantId],
    queryFn: async () => {
      const url = selectedTenantId
        ? `/api/pbx/gateways?tenantId=${selectedTenantId}`
        : '/api/pbx/gateways';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data as PbxGateway[];
    },
  });

  // Create gateway form
  const form = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewayFormSchema),
    defaultValues: {
      tenantId: 0,
      name: '',
      host: '',
      port: 5060,
      transportType: 'udp',
      registerEnabled: false,
      active: true,
    },
  });

  // Create gateway route form
  const routeForm = useForm<GatewayRouteFormValues>({
    resolver: zodResolver(gatewayRouteFormSchema),
    defaultValues: {
      gatewayId: 0,
      prefix: '',
      priority: 1,
      stripDigits: 0,
      active: true,
    },
  });

  // Create gateway mutation
  const createGateway = useMutation({
    mutationFn: async (values: GatewayFormValues) => {
      return apiRequest('POST', '/api/pbx/gateways', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pbx/gateways'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'PBX gateway created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create PBX gateway.',
        variant: 'destructive',
      });
      console.error('Failed to create gateway:', error);
    },
  });

  // Create gateway route mutation
  const createGatewayRoute = useMutation({
    mutationFn: async (values: GatewayRouteFormValues) => {
      return apiRequest('POST', '/api/pbx/gateway-routes', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pbx/gateway-routes'] });
      setIsAddRouteDialogOpen(false);
      routeForm.reset();
      toast({
        title: 'Success',
        description: 'Gateway route created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create gateway route.',
        variant: 'destructive',
      });
      console.error('Failed to create gateway route:', error);
    },
  });

  const onSubmitGateway = (values: GatewayFormValues) => {
    createGateway.mutate(values);
  };

  const onSubmitGatewayRoute = (values: GatewayRouteFormValues) => {
    createGatewayRoute.mutate(values);
  };

  // If still loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">SIP Gateways</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-3 pb-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error handling
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">SIP Gateways</h2>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load SIP gateways. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SIP Gateways</h2>
          <p className="text-gray-500 mt-1">Manage SIP gateways for outbound routing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gateway
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New SIP Gateway</DialogTitle>
                  <DialogDescription>
                    Create a new SIP gateway for outbound calling. 
                    Each tenant can have multiple gateways.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitGateway)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tenantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant</FormLabel>
                          <Select 
                            defaultValue={field.value === 0 ? undefined : field.value.toString()} 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tenant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {tenants?.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                  {tenant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gateway Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Main SIP Provider" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Host</FormLabel>
                          <FormControl>
                            <Input placeholder="sip.provider.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5060"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="transportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transport Type</FormLabel>
                          <Select 
                            defaultValue={field.value} 
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transport type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="udp">UDP</SelectItem>
                              <SelectItem value="tcp">TCP</SelectItem>
                              <SelectItem value="tls">TLS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="registerEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Register to Provider</FormLabel>
                            <FormDescription>
                              Enable registration to this SIP provider
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Main outbound provider for international calls" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Enable this gateway for immediate use
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createGateway.isPending}>
                        {createGateway.isPending && (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Gateway
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter by tenant */}
      <div className="flex items-center space-x-2">
        <label htmlFor="tenantFilter" className="text-sm font-medium">
          Filter by Tenant:
        </label>
        <Select 
          defaultValue={selectedTenantId?.toString() || "all"} 
          onValueChange={(value) => setSelectedTenantId(value === "all" ? null : parseInt(value))}
        >
          <SelectTrigger id="tenantFilter" className="w-[240px]">
            <SelectValue placeholder="All Tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gateway tabs */}
      <Tabs defaultValue="gateways" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gateways">
            <Globe className="h-4 w-4 mr-2" />
            Gateways
          </TabsTrigger>
          <TabsTrigger value="routes">
            <Network className="h-4 w-4 mr-2" />
            Outbound Routes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="gateways" className="pt-4">
          {/* Gateways grid */}
          {gateways?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-4 text-center">
                <Globe className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium">No Gateways Found</h3>
                {selectedTenantId ? (
                  <p className="text-sm text-gray-500 mt-1">
                    No SIP gateways for the selected tenant. 
                    {isAdmin && " Use the 'Add Gateway' button to create one."}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    No SIP gateways exist yet. 
                    {isAdmin && " Use the 'Add Gateway' button to create your first gateway."}
                  </p>
                )}
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Gateway
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gateways?.map((gateway) => (
                <Card key={gateway.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle>{gateway.name}</CardTitle>
                      <Badge 
                        className={gateway.active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                        variant={gateway.active ? "outline" : "secondary"}>
                        {gateway.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>{gateway.host}:{gateway.port}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tenant:</span>
                        <span className="font-medium">
                          {tenants?.find((t) => t.id === gateway.tenantId)?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transport:</span>
                        <span className="font-medium uppercase">{gateway.transportType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registration:</span>
                        <span className={`font-medium ${gateway.registerEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                          {gateway.registerEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 pt-3">
                    <div className="w-full space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-between"
                        onClick={() => {
                          setSelectedGateway(gateway);
                          setIsAddRouteDialogOpen(true);
                          routeForm.setValue('gatewayId', gateway.id);
                        }}
                      >
                        Add Route
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" className="w-full justify-between" onClick={() => {}}>
                        Settings
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="routes" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Outbound Routing</CardTitle>
              <CardDescription>
                Configure prefix-based outbound routing for your gateways
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left font-medium">Prefix</th>
                      <th className="h-10 px-4 text-left font-medium">Gateway</th>
                      <th className="h-10 px-4 text-left font-medium">Priority</th>
                      <th className="h-10 px-4 text-left font-medium">Strip</th>
                      <th className="h-10 px-4 text-left font-medium">Prepend</th>
                      <th className="h-10 px-4 text-left font-medium">Status</th>
                      <th className="h-10 px-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Routes will be listed here */}
                    <tr className="border-b">
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="text-center py-4 text-gray-500">
                          No routes configured yet. Click "Add Route" to create your first route.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <p className="text-sm text-muted-foreground">
                Routes are processed in priority order (1 is highest)
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddRouteDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Route Dialog */}
      <Dialog open={isAddRouteDialogOpen} onOpenChange={setIsAddRouteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Outbound Route</DialogTitle>
            <DialogDescription>
              Create a new outbound routing rule to direct calls through a specific gateway.
            </DialogDescription>
          </DialogHeader>
          <Form {...routeForm}>
            <form onSubmit={routeForm.handleSubmit(onSubmitGatewayRoute)} className="space-y-4">
              <FormField
                control={routeForm.control}
                name="gatewayId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gateway</FormLabel>
                    <Select 
                      defaultValue={field.value === 0 ? undefined : field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a gateway" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gateways?.map((gateway) => (
                          <SelectItem key={gateway.id} value={gateway.id.toString()}>
                            {gateway.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={routeForm.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prefix</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pattern to match the beginning of dialed numbers (e.g., "1" for US numbers)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={routeForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={routeForm.control}
                  name="stripDigits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strip Digits</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={routeForm.control}
                name="prepend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prepend</FormLabel>
                    <FormControl>
                      <Input placeholder="011" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Digits to add to the beginning of the number (e.g., for international format)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={routeForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable this route for immediate use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createGatewayRoute.isPending}>
                  {createGatewayRoute.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Route
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxGateways;