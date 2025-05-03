import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { RecentActivity as ActivityType } from '@shared/types';
import { formatDistance } from 'date-fns';
import { Link } from 'wouter';
import { Users, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';

export function RecentActivity() {
  const { data, isLoading, error } = useQuery<ActivityType[]>({
    queryKey: ['/api/dashboard/activity'],
    retry: false
  });
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return (
          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
            <Users className="h-5 w-5 text-white" />
          </span>
        );
      case 'ticket':
        return (
          <span className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center ring-8 ring-white">
            <MessageSquare className="h-5 w-5 text-white" />
          </span>
        );
      case 'resolved':
        return (
          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
            <CheckCircle className="h-5 w-5 text-white" />
          </span>
        );
      case 'alert':
        return (
          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white">
            <AlertTriangle className="h-5 w-5 text-white" />
          </span>
        );
      default:
        return (
          <span className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center ring-8 ring-white">
            <Users className="h-5 w-5 text-white" />
          </span>
        );
    }
  };
  
  if (error) {
    return (
      <Card className="bg-white overflow-hidden shadow rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-6 text-gray-900">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Error loading activity data</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardHeader className="px-4 py-5 sm:px-6">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-6">
        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Loading activity data...</p>
          </div>
        ) : (
          <div className="mt-4 flow-root">
            <ul role="list" className="-mb-8">
              {data && data.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < data.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        {getIcon(activity.type)}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: activity.message }} />
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.timestamp.toString()}>
                            {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6">
          <Link href="/activity">
            <Button variant="outline" className="w-full justify-center px-4 py-2">
              View all
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
