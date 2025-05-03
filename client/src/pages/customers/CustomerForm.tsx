import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Customer, Plan } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { queryClient } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

// Schema for customer form
const customerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Must be a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "suspended", "terminated"]),
  planId: z.string().min(1, "A plan is required")
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  id?: number;
}

export default function CustomerForm({ id }: CustomerFormProps = {}) {
  const isEditMode = !!id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch customer data if in edit mode
  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: [`/api/customers/${id}`],
    enabled: isEditMode,
    retry: false
  });

  // Fetch customer's subscription if in edit mode
  const { data: subscription } = useQuery<{ plan: Plan }>({
    queryKey: [`/api/customers/${id}/subscription`],
    enabled: isEditMode,
    retry: false
  });

  // Fetch available plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
    retry: false
  });

  // Form setup
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullName: '',
      address: '',
      phone: '',
      status: 'active',
      planId: ''
    }
  });

  // Update form with customer data when loaded
  useEffect(() => {
    if (customer && subscription) {
      form.reset({
        username: customer.username,
        password: '', // Don't show the password for security
        email: customer.email,
        fullName: customer.fullName,
        address: customer.address || '',
        phone: customer.phone || '',
        status: customer.status as any,
        planId: subscription?.plan?.id.toString() || ''
      });
    }
  }, [customer, subscription, form]);

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // First create the customer
      const response = await apiRequest('POST', '/api/customers', {
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.fullName,
        address: data.address,
        phone: data.phone,
        status: data.status
      });
      
      const customerData = await response.json();
      
      // Then create a subscription for the new customer
      await apiRequest('POST', '/api/subscriptions', {
        customerId: customerData.id,
        planId: parseInt(data.planId),
        startDate: new Date(),
        status: 'active'
      });
      
      return customerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'Customer Created',
        description: 'The customer has been created successfully.',
      });
      navigate('/customers');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create customer.',
      });
    }
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Update the customer
      const response = await apiRequest('PUT', `/api/customers/${id}`, {
        username: data.username,
        ...(data.password ? { password: data.password } : {}),
        email: data.email,
        fullName: data.fullName,
        address: data.address,
        phone: data.phone,
        status: data.status
      });
      
      const customerData = await response.json();
      
      // Check if we need to update the subscription
      if (subscription?.plan?.id.toString() !== data.planId) {
        // Get the subscription id first (in a real app we'd have this)
        const subscriptionsResponse = await fetch(`/api/customers/${id}/subscription`, {
          credentials: 'include'
        });
        
        if (subscriptionsResponse.ok) {
          const subData = await subscriptionsResponse.json();
          // Update the subscription with new plan
          await apiRequest('PUT', `/api/subscriptions/${subData.id}`, {
            planId: parseInt(data.planId),
            status: 'active'
          });
        }
      }
      
      return customerData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: 'Customer Updated',
        description: 'The customer has been updated successfully.',
      });
      navigate('/customers');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update customer.',
      });
    }
  });

  const onSubmit = (data: CustomerFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = isLoadingCustomer || isLoadingPlans || createMutation.isPending || updateMutation.isPending;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditMode ? 'Edit Customer' : 'New Customer'}
        </h1>

        <Card className="mt-6">
          <CardHeader className="pb-1">
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && isEditMode ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isEditMode} />
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
                          <FormLabel>{isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field}
                              placeholder={isEditMode ? "••••••••" : ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="terminated">Terminated</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription Plan</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plans?.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id.toString()}>
                                {plan.name} - {plan.downloadSpeed}Mbps/{plan.uploadSpeed}Mbps - ${plan.price}/month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the subscription plan for this customer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/customers')}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEditMode ? 'Update Customer' : 'Create Customer'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
