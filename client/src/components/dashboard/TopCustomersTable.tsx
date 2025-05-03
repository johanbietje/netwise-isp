import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { TopCustomer } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'wouter';

export function TopCustomersTable() {
  const [timeRange, setTimeRange] = useState('month');
  
  const { data, isLoading, error } = useQuery<TopCustomer[]>({
    queryKey: ['/api/dashboard/top-customers'],
    retry: false
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  if (error) {
    return (
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">
            Top Customers by Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading customer data</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">
            Top Customers by Usage
          </CardTitle>
          <div className="ml-4">
            <select
              id="timeRange"
              name="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="month">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-6">
        <div className="mt-4 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading customer data...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data && data.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                  <AvatarFallback>{getInitials(customer.fullName)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <Link href={`/customers/${customer.id}`}>
                                    <a className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                      {customer.fullName}
                                    </a>
                                  </Link>
                                  <div className="text-sm text-gray-500">{customer.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{customer.plan}</div>
                              <div className="text-sm text-gray-500">{customer.speed}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{customer.usage} TB</div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${customer.percentage}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge className={getStatusColor(customer.status)}>
                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TopCustomersTable;
