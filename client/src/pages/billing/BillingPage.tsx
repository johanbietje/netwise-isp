import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Billing, Customer } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { format } from 'date-fns';
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  Check, 
  Clock, 
  AlertCircle, 
  Download,
  Filter
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function BillingPage() {
  const [tab, setTab] = useState('pending');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch pending billings
  const { data: pendingBillings, isLoading: isLoadingPending } = useQuery<Billing[]>({
    queryKey: ['/api/billings', { pending: true }],
    retry: false
  });

  // A helper function to get a customer's name
  const getCustomerName = async (customerId: number): Promise<string> => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const customer: Customer = await response.json();
        return customer.fullName;
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
    return 'Unknown Customer';
  };

  // Update billing status mutation
  const updateBillingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/billings/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billings'] });
      toast({
        title: 'Billing Updated',
        description: 'The billing status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update billing status.',
      });
    }
  });

  // Handler for marking a bill as paid
  const handleMarkAsPaid = (id: number) => {
    updateBillingMutation.mutate({ id, status: 'paid' });
  };

  // Render the status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Billing Management</h1>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Pending Invoices
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="h-4 w-4 mr-2" />
              Billing History
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Pending Invoices</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[200px]"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPending ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">Loading billing data...</p>
                  </div>
                ) : pendingBillings?.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No pending invoices found.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingBillings?.map((billing) => (
                          <TableRow key={billing.id}>
                            <TableCell className="font-medium">INV-{billing.id.toString().padStart(5, '0')}</TableCell>
                            <TableCell>
                              {/* In a real app, we would fetch or include customer details */}
                              Customer #{billing.customerId}
                            </TableCell>
                            <TableCell>R {billing.amount.toFixed(2)}</TableCell>
                            <TableCell>{new Date(billing.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{renderStatusBadge(billing.status)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      className="h-4 w-4"
                                    >
                                      <circle cx="12" cy="12" r="1" />
                                      <circle cx="12" cy="5" r="1" />
                                      <circle cx="12" cy="19" r="1" />
                                    </svg>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(billing.id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    <span>Mark as Paid</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Download Invoice</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Clock className="mr-2 h-4 w-4" />
                                    <span>Mark as Overdue</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Billing History</CardTitle>
                <div className="flex items-center space-x-2">
                  <DateRangePicker />
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10 text-gray-500">
                  <p>Select a date range to view billing history.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Billing Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="p-6 h-auto flex flex-col items-center justify-center space-y-2">
                    <Calendar className="h-8 w-8 mb-2" />
                    <span className="text-lg font-medium">Monthly Revenue Report</span>
                    <span className="text-sm text-gray-500">Download a summary of monthly revenue</span>
                  </Button>
                  
                  <Button className="p-6 h-auto flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <span className="text-lg font-medium">Overdue Payments Report</span>
                    <span className="text-sm text-gray-500">View all overdue customer payments</span>
                  </Button>
                  
                  <Button className="p-6 h-auto flex flex-col items-center justify-center space-y-2">
                    <CreditCard className="h-8 w-8 mb-2" />
                    <span className="text-lg font-medium">Payment Methods Report</span>
                    <span className="text-sm text-gray-500">Analysis of payment methods used</span>
                  </Button>
                  
                  <Button className="p-6 h-auto flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 mb-2" />
                    <span className="text-lg font-medium">Custom Financial Report</span>
                    <span className="text-sm text-gray-500">Generate a custom financial report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
