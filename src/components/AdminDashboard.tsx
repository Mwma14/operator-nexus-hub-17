import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, Package, CreditCard, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  pendingCreditRequests: number;
  totalRevenue: number;
  activeUsers: number;
}

interface RecentActivity {
  id: number;
  action_type: string;
  target_type: string;
  target_id: string;
  notes: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch statistics
        const [usersRes, productsRes, ordersRes, creditsRes] = await Promise.all([
        window.ezsite.apis.tablePage(44173, { PageNo: 1, PageSize: 1 }), // user_profiles
        window.ezsite.apis.tablePage(44172, { PageNo: 1, PageSize: 1 }), // products
        window.ezsite.apis.tablePage(44175, {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'approval_status', op: 'Equal', value: 'pending' }]
        }), // pending orders
        window.ezsite.apis.tablePage(44176, {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'status', op: 'Equal', value: 'pending' }]
        }) // pending credit transactions
        ]);

        // Calculate total revenue from completed orders
        const completedOrdersRes = await window.ezsite.apis.tablePage(44175, {
          PageNo: 1,
          PageSize: 1000,
          Filters: [{ name: 'status', op: 'Equal', value: 'completed' }]
        });

        const totalRevenue = completedOrdersRes.data?.List?.reduce((sum: number, order: any) => sum + (order.amount || 0), 0) || 0;

        // Count active users (logged in within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsersRes = await window.ezsite.apis.tablePage(44173, {
          PageNo: 1,
          PageSize: 1,
          Filters: [{ name: 'last_login', op: 'GreaterThan', value: thirtyDaysAgo.toISOString() }]
        });

        setStats({
          totalUsers: usersRes.data?.VirtualCount || 0,
          totalProducts: productsRes.data?.VirtualCount || 0,
          pendingOrders: ordersRes.data?.VirtualCount || 0,
          pendingCreditRequests: creditsRes.data?.VirtualCount || 0,
          totalRevenue,
          activeUsers: activeUsersRes.data?.VirtualCount || 0
        });

        // Fetch recent activities
        const activitiesRes = await window.ezsite.apis.tablePage(44177, {
          PageNo: 1,
          PageSize: 10,
          OrderByField: 'created_at',
          IsAsc: false
        });

        if (activitiesRes.error) throw new Error(activitiesRes.error);

        setRecentActivities(activitiesRes.data?.List || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>);

  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 flex items-center justify-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRevenue || 0} MMK</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats?.pendingOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Requests</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats?.pendingCreditRequests || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activities</CardTitle>
          <CardDescription>Latest administrative actions performed</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ?
          <p className="text-center text-gray-500 py-8">No recent activities found</p> :

          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) =>
                <TableRow key={activity.id}>
                      <TableCell>
                        <Badge variant="outline">{activity.action_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {activity.target_type} #{activity.target_id}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.notes || 'No notes'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}