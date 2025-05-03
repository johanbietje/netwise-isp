import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ActivityIcon,
  Filter,
  Search,
  Loader2,
  RefreshCcw,
  User,
  User2,
  ShieldAlert,
  ShieldCheck,
  Settings,
  LogIn,
  LogOut,
  BarChart,
  FilePenLine,
  MessageSquare,
  Server,
  Phone
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ActivityPage() {
  const [dateRange, setDateRange] = useState('7days');
  const [activityType, setActivityType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Activity data query
  const { 
    data: activityData = [], 
    isLoading: isLoadingActivity,
    refetch: refetchActivity
  } = useQuery({
    queryKey: ['/api/activity', dateRange, activityType],
    queryFn: async () => {
      // Fetch from the server
      const res = await fetch(`/api/activity?dateRange=${dateRange}&type=${activityType}`);
      if (!res.ok) throw new Error('Failed to fetch activity data');
      return res.json();
    },
    enabled: true, // Always fetch on component mount
  });

  // Filter activity data by search query
  const filteredActivityData = activityData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.action.toLowerCase().includes(searchLower) ||
      item.details.toLowerCase().includes(searchLower) ||
      (item.username && item.username.toLowerCase().includes(searchLower)) ||
      (item.customerName && item.customerName.toLowerCase().includes(searchLower)) ||
      (item.ipAddress && item.ipAddress.includes(searchQuery))
    );
  });

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  };

  // Get action icon based on action type
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return <LogIn className="h-4 w-4 mr-2" />;
      case 'customer':
        return <User2 className="h-4 w-4 mr-2" />;
      case 'system':
        return <Settings className="h-4 w-4 mr-2" />;
      case 'ticket':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'pbx':
        return <Phone className="h-4 w-4 mr-2" />;
      case 'alert':
        return <ShieldAlert className="h-4 w-4 mr-2" />;
      case 'billing':
        return <FilePenLine className="h-4 w-4 mr-2" />;
      case 'security':
        return <ShieldCheck className="h-4 w-4 mr-2" />;
      case 'radius':
        return <Server className="h-4 w-4 mr-2" />;
      default:
        return <ActivityIcon className="h-4 w-4 mr-2" />;
    }
  };

  // Get badge color based on action type
  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'auth':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'ticket':
        return 'bg-yellow-100 text-yellow-800';
      case 'pbx':
        return 'bg-indigo-100 text-indigo-800';
      case 'alert':
        return 'bg-red-100 text-red-800';
      case 'billing':
        return 'bg-green-100 text-green-800';
      case 'security':
        return 'bg-orange-100 text-orange-800';
      case 'radius':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Activity</h1>
          <p className="text-gray-500 mt-1">
            Track and monitor all system events and user actions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1day">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => refetchActivity()} 
            variant="outline" 
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Complete record of all system events and user actions
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search activities..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select defaultValue={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="ticket">Tickets</SelectItem>
                  <SelectItem value="pbx">PBX</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="radius">RADIUS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoadingActivity ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredActivityData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <ActivityIcon className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-500">No activities found</h3>
              <p className="text-gray-400 mt-1 max-w-md">
                {searchQuery
                  ? `No activities match your search for "${searchQuery}"`
                  : `No activities recorded in the selected time period`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User/Customer</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivityData.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getActionIcon(activity.type)}
                          <span className="font-medium">{activity.action}</span>
                        </div>
                        <div className="mt-1">
                          <Badge className={`${getActionBadgeColor(activity.type)} font-normal text-xs`}>
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{activity.details}</p>
                      </TableCell>
                      <TableCell>
                        {activity.username ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-500" />
                            {activity.username}
                          </div>
                        ) : activity.customerName ? (
                          <div className="flex items-center">
                            <User2 className="h-4 w-4 mr-1 text-gray-500" />
                            {activity.customerName}
                          </div>
                        ) : (
                          <span className="text-gray-500">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="whitespace-nowrap">
                          {formatTimestamp(activity.timestamp)}
                        </div>
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
  );
}