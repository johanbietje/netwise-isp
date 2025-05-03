import { Users, Activity, AlertCircle, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from '@shared/types';
import StatsCard from '@/components/dashboard/StatsCard';
import BandwidthChart from '@/components/dashboard/BandwidthChart';
import TopCustomersTable from '@/components/dashboard/TopCustomersTable';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { RadiusStatusCard } from '@/components/dashboard/RadiusStatusCard';

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    retry: false
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats Overview */}
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Customers"
            value={isLoading ? '-' : stats?.totalCustomers || 0}
            change={isLoading ? 0 : stats?.customersGrowth || 0}
            icon={Users}
            iconColor="bg-blue-500"
          />
          <StatsCard
            title="Active Sessions"
            value={isLoading ? '-' : stats?.activeSessions || 0}
            change={isLoading ? 0 : stats?.sessionsGrowth || 0}
            icon={Activity}
            iconColor="bg-green-500"
          />
          <StatsCard
            title="Open Tickets"
            value={isLoading ? '-' : stats?.openTickets || 0}
            change={isLoading ? 0 : stats?.ticketsGrowth || 0}
            icon={AlertCircle}
            iconColor="bg-red-500"
          />
          <StatsCard
            title="Bandwidth Usage"
            value={isLoading ? '-' : `${stats?.bandwidthUsage || 0} TB`}
            change={isLoading ? 0 : stats?.bandwidthGrowth || 0}
            icon={BarChart2}
            iconColor="bg-indigo-500"
          />
        </div>

        {/* RADIUS Status */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <RadiusStatusCard />
        </div>

        {/* Bandwidth Usage & Top Customers */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <BandwidthChart />
          <TopCustomersTable />
        </div>

        {/* Recent Activity */}
        <div className="mt-6 grid grid-cols-1 gap-5">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
