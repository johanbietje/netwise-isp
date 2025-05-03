import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { PbxCallFlow, PbxTenant } from '@shared/schema';
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
import { AlertCircle, ChevronRight, Edit, Eye, GitBranch, Pencil, Plus, RefreshCw, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const callFlowFormSchema = z.object({
  tenantId: z.number().min(1, 'Tenant is required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  flowData: z.any().default({}),
  active: z.boolean().default(true),
});

type CallFlowFormValues = z.infer<typeof callFlowFormSchema>;

export function PbxCallFlows() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCallFlow, setSelectedCallFlow] = useState<PbxCallFlow | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
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
  
  // Get all PBX call flows or filter by selected tenant
  const {
    data: callFlows,
    isLoading,
    isError,
    refetch,
  } = useQuery<PbxCallFlow[]>({
    queryKey: ['/api/pbx/call-flows', selectedTenantId],
    queryFn: async () => {
      const url = selectedTenantId
        ? `/api/pbx/call-flows?tenantId=${selectedTenantId}`
        : '/api/pbx/call-flows';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data as PbxCallFlow[];
    },
  });

  // Create call flow form
  const form = useForm<CallFlowFormValues>({
    resolver: zodResolver(callFlowFormSchema),
    defaultValues: {
      tenantId: 0,
      name: '',
      description: '',
      flowData: {
        nodes: [],
        edges: [],
      },
      active: true,
    },
  });

  // Edit call flow form
  const editForm = useForm<CallFlowFormValues>({
    resolver: zodResolver(callFlowFormSchema),
    defaultValues: {
      tenantId: 0,
      name: '',
      description: '',
      flowData: {
        nodes: [],
        edges: [],
      },
      active: true,
    },
  });

  // Create call flow mutation
  const createCallFlow = useMutation({
    mutationFn: async (values: CallFlowFormValues) => {
      return apiRequest('POST', '/api/pbx/call-flows', values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pbx/call-flows'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Call flow created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create call flow.',
        variant: 'destructive',
      });
      console.error('Failed to create call flow:', error);
    },
  });

  // Update call flow mutation
  const updateCallFlow = useMutation({
    mutationFn: async (values: CallFlowFormValues & { id: number }) => {
      return apiRequest('PATCH', `/api/pbx/call-flows/${values.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pbx/call-flows'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: 'Success',
        description: 'Call flow updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update call flow.',
        variant: 'destructive',
      });
      console.error('Failed to update call flow:', error);
    },
  });

  const onSubmitCallFlow = (values: CallFlowFormValues) => {
    createCallFlow.mutate(values);
  };

  const onUpdateCallFlow = (values: CallFlowFormValues) => {
    if (selectedCallFlow) {
      updateCallFlow.mutate({
        ...values,
        id: selectedCallFlow.id,
      });
    }
  };

  const openEditDialog = useCallback((callFlow: PbxCallFlow) => {
    setSelectedCallFlow(callFlow);
    editForm.reset({
      tenantId: callFlow.tenantId,
      name: callFlow.name,
      description: callFlow.description || '',
      flowData: callFlow.flowData,
      active: callFlow.active,
    });
    setIsEditDialogOpen(true);
  }, [editForm]);

  const openFlowBuilder = useCallback((callFlow: PbxCallFlow) => {
    setSelectedCallFlow(callFlow);
    setIsBuilderOpen(true);
  }, []);

  // If still loading, show skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Call Flows</h2>
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
          <h2 className="text-2xl font-bold">Call Flows</h2>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load call flows. Please try again.</p>
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
          <h2 className="text-2xl font-bold">Call Flows</h2>
          <p className="text-gray-500 mt-1">Manage visual call flows for your PBX</p>
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
                  New Call Flow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Call Flow</DialogTitle>
                  <DialogDescription>
                    Create a new call flow for call processing. 
                    You can build the flow visually after creation.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitCallFlow)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="tenantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant</FormLabel>
                          <Select 
                            defaultValue={field.value.toString()} 
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
                          <FormLabel>Flow Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Incoming Flow" {...field} />
                          </FormControl>
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
                            <Textarea 
                              placeholder="Handles main incoming calls during business hours"
                              className="min-h-[80px]"
                              {...field}
                              value={field.value || ''}
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
                              Make this call flow active immediately
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
                      <Button type="submit" disabled={createCallFlow.isPending}>
                        {createCallFlow.isPending && (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Call Flow
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

      {/* Call Flows grid */}
      {callFlows?.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-4 text-center">
            <GitBranch className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No Call Flows Found</h3>
            {selectedTenantId ? (
              <p className="text-sm text-gray-500 mt-1">
                No call flows for the selected tenant. 
                {isAdmin && " Use the 'New Call Flow' button to create one."}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                No call flows exist yet. 
                {isAdmin && " Use the 'New Call Flow' button to create your first call flow."}
              </p>
            )}
            {isAdmin && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Call Flow
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {callFlows?.map((callFlow) => (
            <Card key={callFlow.id} className="overflow-hidden relative group">
              {!callFlow.active && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-50 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="outline" className="bg-gray-100 text-gray-700">Inactive</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle>{callFlow.name}</CardTitle>
                  <Badge 
                    className={callFlow.active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
                    variant={callFlow.active ? "outline" : "secondary"}>
                    {callFlow.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  {callFlow.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tenant:</span>
                    <span className="font-medium">
                      {tenants?.find((t) => t.id === callFlow.tenantId)?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nodes:</span>
                    <span className="font-medium">
                      {callFlow.flowData.nodes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Modified:</span>
                    <span className="font-medium">
                      {new Date(callFlow.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 pt-3">
                <div className="w-full grid grid-cols-3 gap-2">
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-center"
                    onClick={() => openEditDialog(callFlow)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-center"
                    onClick={() => openFlowBuilder(callFlow)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Builder
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex items-center justify-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Call Flow Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Call Flow</DialogTitle>
            <DialogDescription>
              Update the call flow details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateCallFlow)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant</FormLabel>
                    <Select 
                      value={field.value.toString()} 
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
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flow Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this call flow
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
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCallFlow.isPending}>
                  {updateCallFlow.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Visual Flow Builder Dialog */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-[90vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Call Flow Builder: {selectedCallFlow?.name}</DialogTitle>
            <DialogDescription>
              Design your call flow by dragging and connecting nodes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full min-h-[500px] border rounded-md bg-gray-50 overflow-hidden">
            {/* This is where the visual flow builder would be rendered */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Visual Flow Builder</h3>
                <p className="max-w-md">
                  Drag components from the left panel to build your call flow.
                  Connect nodes to define the call processing logic.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuilderOpen(false)}>
              Cancel
            </Button>
            <Button>
              Save Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PbxCallFlows;