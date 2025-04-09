import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ActivityItem } from './ActivityItem';
import { Activity, MonthlyPerformance } from '@shared/schema';

export function DashboardCharts() {
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // Use current month as fallback since the history endpoint has issues
  const { data: currentPerformance, isLoading: isLoadingCurrentPerformance } = useQuery<MonthlyPerformance>({
    queryKey: ['/api/performance/current'],
  });

  if (isLoadingCurrentPerformance) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  // Prepare data for pie chart showing distribution of visits and contracts by cafe size
  const pieChartData = currentPerformance ? [
    { name: 'Large Visits', value: currentPerformance.largeVisits || 0, color: '#3B82F6' },
    { name: 'Medium Visits', value: currentPerformance.mediumVisits || 0, color: '#60A5FA' },
    { name: 'Small Visits', value: currentPerformance.smallVisits || 0, color: '#93C5FD' },
    { name: 'Large Contracts', value: currentPerformance.largeContracts || 0, color: '#F59E0B' },
    { name: 'Medium Contracts', value: currentPerformance.mediumContracts || 0, color: '#FBBF24' },
    { name: 'Small Contracts', value: currentPerformance.smallContracts || 0, color: '#FCD34D' }
  ].filter(item => item.value > 0) : [];
  
  // If all values are 0, add a placeholder
  const finalPieChartData = pieChartData.length > 0 ? pieChartData : [
    { name: 'No Data', value: 1, color: '#E5E7EB' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Performance Chart */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Performance Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalPieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {finalPieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-700 mb-4">Recent Activities</h3>
          {isLoadingActivities ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {activities && activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <li className="py-4 text-center text-gray-500">No recent activities</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
