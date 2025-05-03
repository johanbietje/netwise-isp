import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Customer } from '@shared/types';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MessageSquare, PlusCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

export default function TicketsPage() {
  const [filter, setFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const { data: tickets, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets', { open: filter === 'open' }],
    retry: false
  });
  
  // Helper function to get customer details
  const fetchCustomerName = async (customerId: number): Promise<string> => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const customer: Customer = await response.json();
        return customer.fullName;
      }
    } catch (err) {
      console.error("Error fetching customer:", err);
    }
    
    return `Customer #${customerId}`;
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality when API is ready
    console.log('Search for:', searchTerm);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };
  
  const filteredTickets = tickets?.filter(ticket => {
    // Apply priority filter if not "all"
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) {
      return false;
    }
    
    // Apply search term if provided (search in subject or description)
    if (searchTerm && !ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ticket.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Support Tickets</h1>
          <Link href="/tickets/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
        
        <Card className="mt-6">
          <CardHeader className="pb-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <CardTitle>Ticket Management</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant={filter === 'open' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('open')}
                >
                  Open Tickets
                </Button>
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All Tickets
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search tickets..."
                    className="pl-8 w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              
              <div className="flex items-center space-x-2">
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading tickets...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                <p>Error loading tickets. Please try again later.</p>
              </div>
            ) : filteredTickets?.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'open' ? 'No open tickets found.' : 'No tickets match your search criteria.'}
                </p>
                <div className="mt-6">
                  <Link href="/tickets/new">
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Ticket
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Priority
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets?.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">#{ticket.id}</TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket.id}`}>
                            <a className="text-blue-600 hover:text-blue-800">
                              {ticket.subject}
                            </a>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {/* In real app, we would fetch customer name */}
                          Customer #{ticket.customerId}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {ticket.assignedToUserId ? `User #${ticket.assignedToUserId}` : 'Unassigned'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
