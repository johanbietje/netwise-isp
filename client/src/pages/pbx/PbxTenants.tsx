import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { PbxTenant } from '@shared/schema';
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
import { AlertCircle, BuildingIcon, Check, ChevronRight, Plus, RefreshCw, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';

const tenantFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  domain: z.string().min(3, 'Domain must be at least 3 characters'),
  customerId: z.number().min(1, 'Customer ID is required'),
  maxExtensions: z.number().min(1, 'Must allow at least 1 extension'),
  active: z.boolean().default(true),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export function PbxTenants() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Customer selector
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  // Get all customers (for selecting which customer to create tenant for)
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/customers');
      const data = await response.json();
      return data || [];
    },
  });
  
  // Get all PBX tenants or filter by selected customer
  const {
    data: tenants,
    isLoading,
    isError,
    refetch,
  } = useQuery<PbxTenant[]>({
    queryKey: ['/api/pbx/tenants', selectedCustomerId],
    queryFn: async () => {
      const url = selectedCustomerId
        ? `/api/pbx/tenants?customerId=${selectedCustomerId}`
        : '/api/pbx/tenants';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data as PbxTenant[];
    },
  });

  // Create tenant form
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      domain: '',
      customerId: 0,
      maxExtensions: 10,
      active: true,
    },
  });

  // Create tenant mutation
  const createTenant = useMutation({
    mutationFn: async (values: TenantFormValues) => {
      return apiRequest('POST', '/api/pbx/tenants', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pbx/tenants'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'PBX tenant created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create PBX tenant.',
        variant: 'destructive',
      });
      console.error('Failed to create tenant:', error);
    },
  });

  const onSubmit = (values: TenantFormValues) => {
    createTenant.mutate(values);
  };

  // If still loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">PBX Tenants</h2>
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
          <h2 className="text-2xl font-bold">PBX Tenants</h2>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load PBX tenants. Please try again.</p>
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
          <h2 className="text-2xl font-bold">PBX Tenants</h2>
          <p className="text-gray-500 mt-1">Manage telephony tenants for customers</p>
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
                  Add Tenant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New PBX Tenant</DialogTitle>
                  <DialogDescription>
                    Create a new PBX tenant for a customer. Each tenant has its own extensions and call routing.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            >
                              <option value={0} disabled>Select a customer</option>
                              {customers?.map((customer) => (
                                <option key={customer.id} value={customer.id}>
                                  {customer.fullName} ({customer.username})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="AcmeCorp PBX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input placeholder="acmecorp.netwise.pbx" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be used as the SIP domain for this tenant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxExtensions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Extensions</FormLabel>
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
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Enable this tenant for immediate use
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
                      <Button type="submit" disabled={createTenant.isPending}>
                        {createTenant.isPending && (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Tenant
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter by customer */}
      <div className="flex items-center space-x-2">
        <label htmlFor="customerFilter" className="text-sm font-medium">
          Filter by Customer:
        </label>
        <select
          id="customerFilter"
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={selectedCustomerId || ''}
          onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Customers</option>
          {customers?.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Tenants grid */}
      {tenants?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-4 text-center">
            <BuildingIcon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No Tenants Found</h3>
            {selectedCustomerId ? (
              <p className="text-sm text-gray-500 mt-1">
                No PBX tenants for the selected customer. 
                {isAdmin && "Use the 'Add Tenant' button to create one."}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                No PBX tenants exist yet. 
                {isAdmin && "Use the 'Add Tenant' button to create your first tenant."}
              </p>
            )}
            {isAdmin && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants?.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle>{tenant.name}</CardTitle>
                  <Badge 
                    className={tenant.active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                    variant={tenant.active ? "outline" : "secondary"}>
                    {tenant.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{tenant.domain}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">
                      {customers?.find((c) => c.id === tenant.customerId)?.fullName || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Extensions:</span>
                    <span className="font-medium">{tenant.maxExtensions}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-3">
                <Button variant="ghost" className="w-full justify-between" onClick={() => {}}>
                  Manage Extensions
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default PbxTenants;