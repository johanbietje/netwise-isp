import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Download, Upload, Save, RefreshCw } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';

// Define schema for IP network form
const ipNetworkSchema = z.object({
  networkAddress: z.string().min(7, 'Network address is required'),
  subnetMask: z.string().min(7, 'Subnet mask is required'),
  vlanId: z.coerce.number().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  category: z.enum(['customer', 'infrastructure', 'management', 'transit', 'other']),
});

type IPNetworkFormValues = z.infer<typeof ipNetworkSchema>;

// Define schema for IP address form
const ipAddressSchema = z.object({
  ipAddress: z.string().min(7, 'IP address is required'),
  networkId: z.coerce.number(),
  hostname: z.string().optional(),
  macAddress: z.string().optional(),
  status: z.enum(['available', 'reserved', 'assigned', 'dhcp']),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

type IPAddressFormValues = z.infer<typeof ipAddressSchema>;

export function IPAMPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('networks');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<any | null>(null);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  
  // Network form
  const networkForm = useForm<IPNetworkFormValues>({
    resolver: zodResolver(ipNetworkSchema),
    defaultValues: {
      networkAddress: '',
      subnetMask: '',
      vlanId: undefined,
      description: '',
      location: '',
      assignedTo: '',
      category: 'infrastructure',
    }
  });

  // IP address form
  const addressForm = useForm<IPAddressFormValues>({
    resolver: zodResolver(ipAddressSchema),
    defaultValues: {
      ipAddress: '',
      networkId: 0,
      hostname: '',
      macAddress: '',
      status: 'available',
      assignedTo: '',
      description: '',
    }
  });

  // Query for IP networks
  const { 
    data: networks, 
    isLoading: isLoadingNetworks,
    isError: isNetworksError,
    refetch: refetchNetworks
  } = useQuery({
    queryKey: ['/api/ipam/networks'],
  });

  // Query for IP addresses
  const { 
    data: ipAddresses, 
    isLoading: isLoadingAddresses,
    isError: isAddressesError,
    refetch: refetchAddresses
  } = useQuery({
    queryKey: ['/api/ipam/addresses'],
  });

  // Mutation for creating/updating IP network
  const networkMutation = useMutation({
    mutationFn: async (data: IPNetworkFormValues) => {
      const method = editingNetwork ? 'PATCH' : 'POST';
      const url = editingNetwork 
        ? `/api/ipam/networks/${editingNetwork.id}` 
        : '/api/ipam/networks';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ipam/networks'] });
      toast({
        title: editingNetwork ? 'Network Updated' : 'Network Created',
        description: editingNetwork 
          ? 'The network has been updated successfully.'
          : 'A new network has been added to IPAM.',
      });
      setShowNetworkDialog(false);
      networkForm.reset();
      setEditingNetwork(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${editingNetwork ? 'update' : 'create'} network. ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation for creating/updating IP address
  const addressMutation = useMutation({
    mutationFn: async (data: IPAddressFormValues) => {
      const method = editingAddress ? 'PATCH' : 'POST';
      const url = editingAddress 
        ? `/api/ipam/addresses/${editingAddress.id}` 
        : '/api/ipam/addresses';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ipam/addresses'] });
      toast({
        title: editingAddress ? 'IP Address Updated' : 'IP Address Created',
        description: editingAddress 
          ? 'The IP address has been updated successfully.'
          : 'A new IP address has been added to IPAM.',
      });
      setShowAddressDialog(false);
      addressForm.reset();
      setEditingAddress(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${editingAddress ? 'update' : 'create'} IP address. ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation for deleting network
  const deleteNetworkMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/ipam/networks/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ipam/networks'] });
      toast({
        title: 'Network Deleted',
        description: 'The network has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete network. ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation for deleting IP address
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/ipam/addresses/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ipam/addresses'] });
      toast({
        title: 'IP Address Deleted',
        description: 'The IP address has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete IP address. ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle opening the network form dialog
  const handleEditNetwork = (network: any) => {
    setEditingNetwork(network);
    networkForm.reset({
      networkAddress: network.networkAddress,
      subnetMask: network.subnetMask,
      vlanId: network.vlanId,
      description: network.description,
      location: network.location,
      assignedTo: network.assignedTo,
      category: network.category,
    });
    setShowNetworkDialog(true);
  };

  // Handle opening the IP address form dialog
  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    addressForm.reset({
      ipAddress: address.ipAddress,
      networkId: address.networkId,
      hostname: address.hostname,
      macAddress: address.macAddress,
      status: address.status,
      assignedTo: address.assignedTo,
      description: address.description,
    });
    setShowAddressDialog(true);
  };

  // Handle network form submission
  const onNetworkSubmit = (data: IPNetworkFormValues) => {
    networkMutation.mutate(data);
  };

  // Handle IP address form submission
  const onAddressSubmit = (data: IPAddressFormValues) => {
    addressMutation.mutate(data);
  };

  // Calculate address utilization for a network
  const calculateUtilization = (networkId: number) => {
    if (!ipAddresses) return { used: 0, total: 0, percentage: 0 };
    
    const networkAddresses = ipAddresses.filter((addr: any) => addr.networkId === networkId);
    const usedAddresses = networkAddresses.filter((addr: any) => addr.status !== 'available').length;
    const totalAddresses = networkAddresses.length;
    const percentage = totalAddresses > 0 ? Math.round((usedAddresses / totalAddresses) * 100) : 0;
    
    return { used: usedAddresses, total: totalAddresses, percentage };
  };

  // Get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Available</Badge>;
      case 'reserved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Reserved</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Assigned</Badge>;
      case 'dhcp':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">DHCP</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get category badge styles
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'customer':
        return <Badge variant="outline" className="bg-indigo-100 text-indigo-800">Customer</Badge>;
      case 'infrastructure':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Infrastructure</Badge>;
      case 'management':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Management</Badge>;
      case 'transit':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800">Transit</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  // Filter networks based on search term
  const filteredNetworks = networks ? networks.filter((network: any) => {
    return (
      network.networkAddress.includes(searchTerm) ||
      network.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      network.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      network.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  // Filter IP addresses based on search term
  const filteredAddresses = ipAddresses ? ipAddresses.filter((address: any) => {
    return (
      address.ipAddress.includes(searchTerm) ||
      address.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.macAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">IP Address Management (IPAM)</h2>
          <p className="text-gray-500 mt-1">Manage IP networks, subnets, and addresses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => {
            refetchNetworks();
            refetchAddresses();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search networks or IP addresses..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="networks">Networks & Subnets</TabsTrigger>
          <TabsTrigger value="addresses">IP Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="networks" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">IP Networks</h3>
            <Button onClick={() => {
              setEditingNetwork(null);
              networkForm.reset({
                networkAddress: '',
                subnetMask: '',
                vlanId: undefined,
                description: '',
                location: '',
                assignedTo: '',
                category: 'infrastructure',
              });
              setShowNetworkDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingNetworks ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isNetworksError ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Error loading networks</p>
                </div>
              ) : filteredNetworks.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No networks found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Network/CIDR</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>VLAN</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNetworks.map((network: any) => {
                      const utilization = calculateUtilization(network.id);
                      return (
                        <TableRow key={network.id}>
                          <TableCell className="font-medium">
                            <div>{network.networkAddress}/{network.subnetMask}</div>
                            <div className="text-xs text-muted-foreground">{network.description}</div>
                          </TableCell>
                          <TableCell>{getCategoryBadge(network.category)}</TableCell>
                          <TableCell>{network.vlanId || 'N/A'}</TableCell>
                          <TableCell>{network.location || 'N/A'}</TableCell>
                          <TableCell>{network.assignedTo || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500" 
                                  style={{ width: `${utilization.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs">{utilization.used}/{utilization.total}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditNetwork(network)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this network?')) {
                                    deleteNetworkMutation.mutate(network.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">IP Addresses</h3>
            <Button onClick={() => {
              setEditingAddress(null);
              addressForm.reset({
                ipAddress: '',
                networkId: 0,
                hostname: '',
                macAddress: '',
                status: 'available',
                assignedTo: '',
                description: '',
              });
              setShowAddressDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add IP Address
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingAddresses ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isAddressesError ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Error loading IP addresses</p>
                </div>
              ) : filteredAddresses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No IP addresses found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>MAC Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAddresses.map((address: any) => {
                      const network = networks?.find((n: any) => n.id === address.networkId);
                      return (
                        <TableRow key={address.id}>
                          <TableCell className="font-medium">
                            <div>{address.ipAddress}</div>
                            <div className="text-xs text-muted-foreground">{address.description}</div>
                          </TableCell>
                          <TableCell>{address.hostname || 'N/A'}</TableCell>
                          <TableCell>{address.macAddress || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(address.status)}</TableCell>
                          <TableCell>
                            {network ? `${network.networkAddress}/${network.subnetMask}` : 'N/A'}
                          </TableCell>
                          <TableCell>{address.assignedTo || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditAddress(address)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this IP address?')) {
                                    deleteAddressMutation.mutate(address.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Network Form Dialog */}
      <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingNetwork ? 'Edit Network' : 'Add Network'}</DialogTitle>
            <DialogDescription>
              {editingNetwork 
                ? 'Update the details for this IP network or subnet.' 
                : 'Enter the details for the new IP network or subnet.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...networkForm}>
            <form onSubmit={networkForm.handleSubmit(onNetworkSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={networkForm.control}
                  name="networkAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={networkForm.control}
                  name="subnetMask"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subnet Mask</FormLabel>
                      <FormControl>
                        <Input placeholder="255.255.255.0 or 24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={networkForm.control}
                  name="vlanId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VLAN ID</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={networkForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="transit">Transit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={networkForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={networkForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={networkForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNetworkDialog(false);
                    networkForm.reset();
                    setEditingNetwork(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={networkMutation.isPending || !networkForm.formState.isDirty}
                >
                  {networkMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {editingNetwork ? 'Update Network' : 'Add Network'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* IP Address Form Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit IP Address' : 'Add IP Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? 'Update the details for this IP address.' 
                : 'Enter the details for the new IP address.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="networkId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {networks?.map((network: any) => (
                            <SelectItem key={network.id} value={network.id.toString()}>
                              {network.networkAddress}/{network.subnetMask}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="hostname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hostname</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="macAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MAC Address</FormLabel>
                      <FormControl>
                        <Input placeholder="00:11:22:33:44:55" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="dhcp">DHCP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addressForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddressDialog(false);
                    addressForm.reset();
                    setEditingAddress(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addressMutation.isPending || !addressForm.formState.isDirty}
                >
                  {addressMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAddress ? 'Update IP Address' : 'Add IP Address'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default IPAMPage;