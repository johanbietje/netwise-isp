import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarIcon, Clock, Download, Phone, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function PbxCallLogs() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Get customers for filter
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Example call log item
  const callLogExample = {
    id: 1,
    direction: 'inbound',
    callerId: '5551234567',
    destination: '1001',
    status: 'answered',
    duration: 120, // 2 minutes
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    endTime: new Date(Date.now() - 3 * 60 * 60 * 1000 + 120 * 1000), // 3 hours ago + 2 minutes
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Call Logs</h2>
          <p className="text-gray-500 mt-1">View and filter call records</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by number or extension..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select 
          value={selectedCustomerId?.toString() || 'all'} 
          onValueChange={(value) => setSelectedCustomerId(value !== 'all' ? parseInt(value) : null)}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id.toString()}>
                {customer.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal md:w-[200px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Start Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal md:w-[200px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>End Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Call Log Table (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-4 text-left align-middle font-medium">Direction</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Caller</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Destination</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Time</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Duration</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">
                    <div className={cn(
                      "flex items-center",
                      callLogExample.direction === 'inbound' ? "text-green-600" : "text-blue-600"
                    )}>
                      <Phone className="h-4 w-4 mr-2 rotate-180" />
                      {callLogExample.direction === 'inbound' ? 'Incoming' : 'Outgoing'}
                    </div>
                  </td>
                  <td className="p-4 align-middle font-medium">{callLogExample.callerId}</td>
                  <td className="p-4 align-middle">{callLogExample.destination}</td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span>{format(callLogExample.startTime, 'MMM d, yyyy')}</span>
                      <span className="text-muted-foreground">{format(callLogExample.startTime, 'h:mm a')}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {Math.floor(callLogExample.duration / 60)}:{(callLogExample.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      callLogExample.status === 'answered' 
                        ? "bg-green-100 text-green-800" 
                        : callLogExample.status === 'no-answer'
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    )}>
                      {callLogExample.status === 'answered' ? 'Answered' : 
                       callLogExample.status === 'no-answer' ? 'No Answer' : 'Failed'}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    <Activity className="mx-auto h-8 w-8 text-purple-200 mb-2" />
                    <p>This is a placeholder for call logs data.</p>
                    <p className="text-sm">In a real implementation, this would display actual call records.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PbxCallLogs;