import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BandwidthUsage } from '@shared/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function BandwidthChart() {
  const [days, setDays] = useState(7);
  
  const { data, isLoading, error } = useQuery<BandwidthUsage[]>({
    queryKey: ['/api/dashboard/bandwidth', days],
    retry: false
  });
  
  // Format date labels for display
  const formatData = (data: BandwidthUsage[] | undefined) => {
    if (!data) return [];
    
    return data.map(item => {
      const date = new Date(item.date);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      });
      
      return {
        ...item,
        formattedDate
      };
    });
  };
  
  const formattedData = formatData(data);
  
  if (error) {
    return (
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">
            Bandwidth Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading bandwidth data</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium leading-6 text-gray-900">
              Bandwidth Usage
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Network traffic for last {days} days
            </p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="ml-4 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-6">
        <div className="h-64">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="formattedDate" />
                <YAxis label={{ value: 'TB', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="download"
                  name="Download (TB)"
                  stroke="#3B82F6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="upload"
                  name="Upload (TB)"
                  stroke="#10B981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BandwidthChart;
