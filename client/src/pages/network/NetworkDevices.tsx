import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { NetworkDevice, insertNetworkDeviceSchema } from '@shared/schema';
import { PlusCircle, RefreshCw, Edit, Trash2, AlertCircle, Server, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';

// Extend the insert schema with additional validation
const formSchema = insertNetworkDeviceSchema.extend({
  deviceType: z.enum(['router', 'switch', 'access_point', 'server', 'firewall', 'client']),
  status: z.enum(['active', 'inactive', 'maintenance']),
});

type FormValues = z.infer<typeof formSchema>;

export function NetworkDevices() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isEditDeviceOpen, setIsEditDeviceOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<NetworkDevice | null>(null);
  
  // Device list query
  const { data: devices, isLoading, isError, refetch } = useQuery<NetworkDevice[]>({
    queryKey: ['/api/network/devices'],
    staleTime: 60000, // 1 minute
  });

  // Create device mutation
  const createDevice = useMutation({
    mutationFn: async (device: FormValues) => {
      return apiRequest('/api/network/devices', {
        method: 'POST',
        data: device,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Network device created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/network/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/topology'] });
      setIsAddDeviceOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create network device',
        variant: 'destructive',
      });
    },
  });

  // Update device mutation
  const updateDevice = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormValues> }) => {
      return apiRequest(`/api/network/devices/${id}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Network device updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/network/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/topology'] });
      setIsEditDeviceOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update network device',
        variant: 'destructive',
      });
    },
  });

  // Delete device mutation
  const deleteDevice = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/network/devices/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Network device deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/network/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network/topology'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete network device',
        variant: 'destructive',
      });
    },
  });

  // Add device form
  const addForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      deviceType: 'router',
      status: 'active',
      ipAddress: '',
      macAddress: '',
      manufacturer: '',
      model: '',
      location: '',
      description: '',
      snmpEnabled: false,
      snmpCommunity: '',
      firmwareVersion: '',
      icon: '',
    },
  });

  // Edit device form
  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      deviceType: 'router',
      status: 'active',
      ipAddress: '',
      macAddress: '',
      manufacturer: '',
      model: '',
      location: '',
      description: '',
      snmpEnabled: false,
      snmpCommunity: '',
      firmwareVersion: '',
      icon: '',
    },
  });

  // Handle add device submission
  const onAddSubmit = (data: FormValues) => {
    createDevice.mutate(data);
  };

  // Handle edit device submission
  const onEditSubmit = (data: FormValues) => {
    if (currentDevice) {
      updateDevice.mutate({
        id: currentDevice.id,
        data,
      });
    }
  };

  // Handle edit device button click
  const handleEditDevice = (device: NetworkDevice) => {
    setCurrentDevice(device);
    editForm.reset({
      name: device.name,
      deviceType: device.deviceType as any,
      status: device.status as any,
      ipAddress: device.ipAddress || '',
      macAddress: device.macAddress || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      location: device.location || '',
      description: device.description || '',
      snmpEnabled: device.snmpEnabled || false,
      snmpCommunity: device.snmpCommunity || '',
      firmwareVersion: device.firmwareVersion || '',
      icon: device.icon || '',
    });
    setIsEditDeviceOpen(true);
  };

  // Handle delete device button click
  const handleDeleteDevice = (id: number) => {
    if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      deleteDevice.mutate(id);
    }
  };

  // Filter devices based on search term
  const filteredDevices = devices?.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        
        <div className="rounded-md border">
          <div className="flex items-center p-4 border-b">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
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
          Failed to load network devices.
          <Button variant="outline" size="sm" className="ml-2" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search devices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {isAdmin && (
            <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Network Device</DialogTitle>
                  <DialogDescription>
                    Add a new device to your network infrastructure.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Main Router" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="deviceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Device Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select device type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="router">Router</SelectItem>
                                <SelectItem value="switch">Switch</SelectItem>
                                <SelectItem value="access_point">Access Point</SelectItem>
                                <SelectItem value="server">Server</SelectItem>
                                <SelectItem value="firewall">Firewall</SelectItem>
                                <SelectItem value="client">Client Device</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="ipAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Address</FormLabel>
                            <FormControl>
                              <Input placeholder="192.168.1.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="macAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MAC Address</FormLabel>
                            <FormControl>
                              <Input placeholder="00:1A:2B:3C:4D:5E" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Server Room" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Manufacturer</FormLabel>
                            <FormControl>
                              <Input placeholder="Cisco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model</FormLabel>
                            <FormControl>
                              <Input placeholder="ASR 1001-X" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={addForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Main router for the network" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="firmwareVersion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmware Version</FormLabel>
                          <FormControl>
                            <Input placeholder="v1.2.3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="snmpEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>SNMP Monitoring</FormLabel>
                            <FormDescription>
                              Enable SNMP monitoring for this device
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
                    
                    {addForm.watch('snmpEnabled') && (
                      <FormField
                        control={addForm.control}
                        name="snmpCommunity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SNMP Community String</FormLabel>
                            <FormControl>
                              <Input placeholder="public" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createDevice.isPending}>
                        {createDevice.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Add Device
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {filteredDevices && filteredDevices.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>
                    {device.deviceType === 'router' && <Server className="h-4 w-4 mr-2 inline-block text-amber-500" />}
                    {device.deviceType === 'switch' && <Server className="h-4 w-4 mr-2 inline-block text-blue-500" />}
                    {device.deviceType === 'access_point' && <Server className="h-4 w-4 mr-2 inline-block text-emerald-500" />}
                    {device.deviceType === 'server' && <Server className="h-4 w-4 mr-2 inline-block text-indigo-500" />}
                    {device.deviceType === 'firewall' && <Server className="h-4 w-4 mr-2 inline-block text-red-500" />}
                    {device.deviceType}
                  </TableCell>
                  <TableCell>{device.ipAddress || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell>{device.location || 'N/A'}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDevice(device)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDevice(device.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-6 border rounded-md">
          <Server className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No devices found</h3>
          <p className="text-sm text-muted-foreground">
            {filteredDevices?.length === 0 && devices?.length ? 
              'No devices match your search criteria.' : 
              'Add network devices to start monitoring your network.'}
          </p>
        </div>
      )}
      
      {/* Edit Device Dialog */}
      <Dialog open={isEditDeviceOpen} onOpenChange={setIsEditDeviceOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Network Device</DialogTitle>
            <DialogDescription>
              Update device information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="deviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="router">Router</SelectItem>
                          <SelectItem value="switch">Switch</SelectItem>
                          <SelectItem value="access_point">Access Point</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="firewall">Firewall</SelectItem>
                          <SelectItem value="client">Client Device</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="macAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="firmwareVersion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firmware Version</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="snmpEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>SNMP Monitoring</FormLabel>
                      <FormDescription>
                        Enable SNMP monitoring for this device
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
              
              {editForm.watch('snmpEnabled') && (
                <FormField
                  control={editForm.control}
                  name="snmpCommunity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SNMP Community String</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit" disabled={updateDevice.isPending}>
                  {updateDevice.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Update Device
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default NetworkDevices;