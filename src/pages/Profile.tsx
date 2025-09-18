import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { CreditCard, Package, TrendingUp, Calendar, Eye, RefreshCw } from 'lucide-react';

interface UserInfo {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
  Roles: string;
}

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_description: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  operator: string;
  category: string;
  created_at: string;
  updated_at: string;
  transaction_id?: string;
}

interface OrderStats {
  total_orders: number;
  successful_orders: number;
  pending_orders: number;
  total_spent: number;
}

const Profile = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await window.ezsite.apis.getUserInfo();
      if (response.error || !response.data) {
        navigate('/auth');
        return;
      }
      setUser(response.data);
      await loadProfileData();
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/auth');
    }
  };

  const loadProfileData = async () => {
    try {
      setIsLoading(true);

      if (!user) return;

      // Mock orders data
      const mockOrders: Order[] = [
      {
        id: '1',
        user_id: user.ID.toString(),
        product_id: 'mpt-data-1gb',
        product_name: 'MPT 1GB Data Pack',
        product_description: 'High-speed data for 30 days',
        amount: 2000,
        currency: 'MMK',
        status: 'completed',
        operator: 'MPT',
        category: 'Data',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:31:00Z',
        transaction_id: 'TXN123456'
      },
      {
        id: '2',
        user_id: user.ID.toString(),
        product_id: 'ooredoo-minutes-100',
        product_name: 'Ooredoo 100 Minutes',
        product_description: '100 minutes to all networks',
        amount: 1500,
        currency: 'MMK',
        status: 'completed',
        operator: 'OOREDOO',
        category: 'Minutes',
        created_at: '2024-01-10T14:20:00Z',
        updated_at: '2024-01-10T14:21:00Z',
        transaction_id: 'TXN123455'
      },
      {
        id: '3',
        user_id: user.ID.toString(),
        product_id: 'mytel-package',
        product_name: 'MyTel Combo Package',
        product_description: 'Data + Minutes package',
        amount: 3000,
        currency: 'MMK',
        status: 'pending',
        operator: 'MYTEL',
        category: 'Packages',
        created_at: '2024-01-20T09:15:00Z',
        updated_at: '2024-01-20T09:15:00Z'
      }];


      // Mock order stats
      const mockOrderStats: OrderStats = {
        total_orders: mockOrders.length,
        successful_orders: mockOrders.filter((o) => o.status === 'completed').length,
        pending_orders: mockOrders.filter((o) => o.status === 'pending').length,
        total_spent: mockOrders.
        filter((o) => o.status === 'completed').
        reduce((sum, o) => sum + o.amount, 0)
      };

      setProfile(mockProfile);
      setOrders(mockOrders);
      setOrderStats(mockOrderStats);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (!user) return;
    setIsRefreshing(true);
    await loadProfileData();
    setIsRefreshing(false);
    toast({
      title: "Data refreshed",
      description: "Your profile data has been updated."
    });
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'completed':return 'default';
      case 'pending':return 'secondary';
      case 'failed':return 'destructive';
      case 'cancelled':return 'outline';
      default:return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name.
    split(' ').
    map((part) => part[0]).
    join('').
    toUpperCase().
    slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) =>
              <Skeleton key={i} className="h-32" />
              )}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              <p className="text-muted-foreground">
                Manage your account and view your order history
              </p>
            </div>
            <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Credits Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  15,000 MMK
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats?.total_orders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Orders</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {orderStats?.successful_orders}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderStats?.total_spent?.toLocaleString()} MMK
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-lg">
                        {user?.Name ? getInitials(user.Name) :
                        user?.Email ? getInitials(user.Email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium">
                        {user?.Name || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.Email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Member since {user?.CreateTime ? new Date(user.CreateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    View and manage your recent orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ?
                  <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground">
                        Start shopping to see your orders here.
                      </p>
                    </div> :

                  <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Operator</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) =>
                      <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.product_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.category}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.operator}</Badge>
                            </TableCell>
                            <TableCell>
                              {order.amount.toLocaleString()} {order.currency}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(order.status)}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(order.created_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}>

                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Order Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedOrder &&
                              <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium">Order ID</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.id}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Status</label>
                                          <div className="mt-1">
                                            <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                                              {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Product</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.product_name}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Operator</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.operator}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Amount</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.amount.toLocaleString()} {selectedOrder.currency}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium">Date</label>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(selectedOrder.created_at), 'PPP')}
                                          </p>
                                        </div>
                                      </div>
                                      {selectedOrder.transaction_id &&
                                <div>
                                          <label className="text-sm font-medium">Transaction ID</label>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedOrder.transaction_id}
                                          </p>
                                        </div>
                                }
                                      <div>
                                        <label className="text-sm font-medium">Description</label>
                                        <p className="text-sm text-muted-foreground">
                                          {selectedOrder.product_description}
                                        </p>
                                      </div>
                                    </div>
                              }
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                      )}
                      </TableBody>
                    </Table>
                  }
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>);

};

export default Profile;