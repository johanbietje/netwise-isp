import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, InsertUser } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  PlusCircle, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Key,
  Loader2
} from 'lucide-react';

// Schema for user form
const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Must be a valid email address"),
  fullName: z.string().min(2, "Full name is required"),
  role: z.enum(["admin", "support", "billing"])
});

type UserFormData = z.infer<typeof userSchema>;

export default function RolesPage() {
  const [tab, setTab] = useState('users');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    retry: false
  });
  
  // Form setup for user
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'support'
    }
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest('POST', '/api/users', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User Created',
        description: 'The user has been created successfully.',
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user.',
      });
    }
  });
  
  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };
  
  // Role data mapping - permissions per role
  const rolePermissions = {
    admin: {
      dashboard: ['view'],
      customers: ['create', 'view', 'edit', 'delete'],
      bandwidth: ['view', 'edit'],
      billing: ['create', 'view', 'edit', 'delete'],
      tickets: ['create', 'view', 'edit', 'delete'],
      radius: ['view', 'edit'],
      settings: ['view', 'edit'],
      users: ['create', 'view', 'edit', 'delete']
    },
    support: {
      dashboard: ['view'],
      customers: ['view', 'edit'],
      bandwidth: ['view'],
      billing: ['view'],
      tickets: ['create', 'view', 'edit'],
      radius: [],
      settings: [],
      users: []
    },
    billing: {
      dashboard: ['view'],
      customers: ['view'],
      bandwidth: ['view'],
      billing: ['create', 'view', 'edit'],
      tickets: ['view'],
      radius: [],
      settings: [],
      users: []
    }
  };
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">User & Role Management</h1>
        
        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">
              <UserIcon className="h-4 w-4 mr-2" />
              System Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Role Permissions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">System Users</CardTitle>
                  <CardDescription>
                    Manage user accounts and access levels
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add System User</DialogTitle>
                      <DialogDescription>
                        Create a new user with appropriate access permissions.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
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
                                <Input 
                                  type="password" 
                                  placeholder="••••••••" 
                                  {...field} 
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
                                <Input 
                                  type="email" 
                                  placeholder="john.doe@example.com" 
                                  {...field} 
                                />
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
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                  <SelectItem value="support">Support Agent</SelectItem>
                                  <SelectItem value="billing">Billing Staff</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Assigns access permissions based on selected role
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add User
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/users'] })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                {isLoadingUsers ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                ) : users?.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No users found.</p>
                    <Button 
                      onClick={() => setDialogOpen(true)} 
                      className="mt-4"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.filter(user => 
                          searchTerm === '' || 
                          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <Badge className="bg-blue-100 text-blue-800">Administrator</Badge>
                              ) : user.role === 'support' ? (
                                <Badge className="bg-green-100 text-green-800">Support</Badge>
                              ) : (
                                <Badge className="bg-purple-100 text-purple-800">Billing</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Edit user</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500"
                                disabled={user.username === 'admin'} // Prevent deleting admin
                              >
                                <span className="sr-only">Delete user</span>
                                <Trash2 className="h-4 w-4" />
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
          
          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Role Permissions</CardTitle>
                <CardDescription>
                  Review and understand access permissions by role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module/Feature</TableHead>
                        <TableHead className="text-center">Administrator</TableHead>
                        <TableHead className="text-center">Support Agent</TableHead>
                        <TableHead className="text-center">Billing Staff</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(rolePermissions.admin).map((module) => (
                        <TableRow key={module}>
                          <TableCell className="font-medium capitalize">{module}</TableCell>
                          <TableCell className="text-center">
                            {rolePermissions.admin[module as keyof typeof rolePermissions.admin].length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {rolePermissions.admin[module as keyof typeof rolePermissions.admin].map((permission) => (
                                  <Badge key={permission} className="bg-blue-100 text-blue-800 capitalize">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">No Access</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {rolePermissions.support[module as keyof typeof rolePermissions.support].length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {rolePermissions.support[module as keyof typeof rolePermissions.support].map((permission) => (
                                  <Badge key={permission} className="bg-green-100 text-green-800 capitalize">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">No Access</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-center">
                            {rolePermissions.billing[module as keyof typeof rolePermissions.billing].length > 0 ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {rolePermissions.billing[module as keyof typeof rolePermissions.billing].map((permission) => (
                                  <Badge key={permission} className="bg-purple-100 text-purple-800 capitalize">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">No Access</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 space-y-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Note:</span> Role permissions are predefined in the system configuration. 
                    Custom role creation will be available in a future update.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Card className="flex-1 p-4 bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <h3 className="font-medium">Administrator</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Full access to all system features and configuration options.
                        Can manage users, roles, and system settings.
                      </p>
                    </Card>
                    
                    <Card className="flex-1 p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="h-5 w-5 text-green-500" />
                        <h3 className="font-medium">Support Agent</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Can manage customer accounts, view bandwidth usage,
                        and handle support tickets. Limited access to system settings.
                      </p>
                    </Card>
                    
                    <Card className="flex-1 p-4 bg-purple-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-5 w-5 text-purple-500" />
                        <h3 className="font-medium">Billing Staff</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Focused on financial operations. Can manage invoices, payments,
                        and view customer information. No access to technical settings.
                      </p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
