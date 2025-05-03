import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RadiusClient, RadiusAuth } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  Server, 
  PlusCircle, 
  RefreshCw, 
  Search, 
  Shield, 
  Check, 
  X,
  Loader2
} from 'lucide-react';

// Schema for RADIUS client form
const radiusClientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  ipAddress: z.string().min(7, "Valid IP address is required"),
  secret: z.string().min(6, "Secret must be at least 6 characters"),
  description: z.string().optional(),
  active: z.boolean().default(true)
});

type RadiusClientFormData = z.infer<typeof radiusClientSchema>;

export default function RadiusPage() {
  const [tab, setTab] = useState('clients');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  // Fetch RADIUS clients
  const { data: radiusClients, isLoading: isLoadingClients } = useQuery<RadiusClient[]>({
    queryKey: ['/api/radius/clients'],
    retry: false
  });
  
  // Fetch RADIUS authentication logs
  const { data: authLogs, isLoading: isLoadingLogs } = useQuery<RadiusAuth[]>({
    queryKey: ['/api/radius/auth-logs'],
    retry: false
  });
  
  // Form setup for RADIUS client
  const form = useForm<RadiusClientFormData>({
    resolver: zodResolver(radiusClientSchema),
    defaultValues: {
      name: '',
      ipAddress: '',
      secret: '',
      description: '',
      active: true
    }
  });
  
  // Create RADIUS client mutation
  const createClientMutation = useMutation({
    mutationFn: async (data: RadiusClientFormData) => {
      const response = await apiRequest('POST', '/api/radius/clients', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radius/clients'] });
      toast({
        title: 'RADIUS Client Created',
        description: 'The RADIUS client has been created successfully.',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create RADIUS client.',
      });
    }
  });
  
  // Update RADIUS client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest('PUT', `/api/radius/clients/${id}`, { active });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radius/clients'] });
      toast({
        title: 'RADIUS Client Updated',
        description: 'The RADIUS client status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update RADIUS client.',
      });
    }
  });
  
  const onSubmit = (data: RadiusClientFormData) => {
    createClientMutation.mutate(data);
  };
  
  const toggleClientStatus = (id: number, currentStatus: boolean) => {
    updateClientMutation.mutate({ id, active: !currentStatus });
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search for:', searchTerm);
    // Implement search when API is ready
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">RADIUS Server Management</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">
              <Server className="h-4 w-4 mr-2" />
              RADIUS Clients
            </TabsTrigger>
            <TabsTrigger value="auth">
              <Shield className="h-4 w-4 mr-2" />
              Authentication Logs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">RADIUS NAS Clients</CardTitle>
                  <CardDescription>
                    Manage Network Access Server (NAS) devices that can connect to the RADIUS server
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add RADIUS Client</DialogTitle>
                      <DialogDescription>
                        Add a new Network Access Server (NAS) that will authenticate against this RADIUS server.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Main Router" {...field} />
                              </FormControl>
                              <FormDescription>
                                A descriptive name for this NAS device
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ipAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IP Address</FormLabel>
                              <FormControl>
                                <Input placeholder="192.168.1.1" {...field} />
                              </FormControl>
                              <FormDescription>
                                The IP address of the NAS device
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="secret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shared Secret</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                The shared secret used to authenticate the NAS to the RADIUS server
                              </FormDescription>
                              <FormMessage />
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
                                <Input placeholder="Optional description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Active
                                </FormLabel>
                                <FormDescription>
                                  Enable this NAS client for authentication
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createClientMutation.isPending}
                          >
                            {createClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Client
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <form onSubmit={handleSearch} className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Search clients..."
                        className="pl-8 w-[250px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Search</Button>
                  </form>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/radius/clients'] })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {isLoadingClients ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading RADIUS clients...</p>
                  </div>
                ) : radiusClients?.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No RADIUS clients found.</p>
                    <Button 
                      onClick={() => setDialogOpen(true)} 
                      className="mt-4"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Client
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {radiusClients?.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.ipAddress}</TableCell>
                            <TableCell>{client.description || '-'}</TableCell>
                            <TableCell>
                              {client.active ? (
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleClientStatus(client.id, client.active)}
                                disabled={updateClientMutation.isPending}
                              >
                                {client.active ? 'Disable' : 'Enable'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="auth" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Authentication Logs</CardTitle>
                  <CardDescription>
                    Recent RADIUS authentication attempts
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/radius/auth-logs'] })}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading authentication logs...</p>
                  </div>
                ) : authLogs?.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No authentication logs found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Client IP</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {authLogs?.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{log.username}</TableCell>
                            <TableCell>{log.clientIpAddress}</TableCell>
                            <TableCell>
                              {log.status === 'accept' ? (
                                <div className="flex items-center">
                                  <Check className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="text-green-600">Accepted</span>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <X className="h-4 w-4 text-red-500 mr-1" />
                                  <span className="text-red-600">Rejected</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
