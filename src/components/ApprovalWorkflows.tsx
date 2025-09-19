import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, X, Check, CreditCard, ShoppingCart, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreditTransaction {
  id: number;
  user_id: string;
  transaction_type: string;
  credit_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_reference: string;
  mmk_amount: number;
  previous_balance: number;
  new_balance: number;
  processed_at: string;
  created_at: string;
  admin_notes: string;
}

interface Order {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  total_price: number;
  currency: string;
  status: string;
  operator: string;
  phone_number: string;
  admin_notes: string;
  created_at: string;
  processed_at: string;
}

type ApprovalItem = CreditTransaction | Order;
type ApprovalType = 'credit' | 'order';

export default function ApprovalWorkflows() {
  const [creditRequests, setCreditRequests] = useState<CreditTransaction[]>([]);
  const [orderRequests, setOrderRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [approvalType, setApprovalType] = useState<ApprovalType>('credit');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovalItems();
  }, []);

  const fetchApprovalItems = async () => {
    try {
      setIsLoading(true);

      // Fetch pending credit transactions
      const { data: creditData, error: creditError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (creditError) throw new Error(creditError.message);
      setCreditRequests(creditData || []);

      // Fetch pending orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (orderError) throw new Error(orderError.message);
      setOrderRequests(orderData || []);
    } catch (error) {
      console.error('Failed to fetch approval items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load approval requests',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAction = async (actionType: string, targetType: string, targetId: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user?.id || null,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          old_values: '',
          new_values: '',
          ip_address: '',
          user_agent: navigator.userAgent,
          notes,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const handleApproval = async () => {
    if (!selectedItem) return;

    try {
      setIsProcessing(true);
      const now = new Date().toISOString();
      const isApproval = actionType === 'approve';

      if (approvalType === 'credit') {
        const creditTransaction = selectedItem as CreditTransaction;

        // Update credit transaction status
        const { error: updateError } = await supabase
          .from('credit_transactions')
          .update({
            status: isApproval ? 'approved' : 'rejected',
            admin_notes: notes,
            processed_at: now,
          })
          .eq('id', creditTransaction.id);

        if (updateError) throw new Error(updateError.message);

        // If approved, update user's credit balance
        if (isApproval) {
          const { data: userProfile, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', creditTransaction.user_id)
            .single();

          if (userError) throw new Error(userError.message);

          if (userProfile) {
            const currentBalance = userProfile.credits_balance || 0;
            const newBalance = currentBalance + creditTransaction.credit_amount;

            const { error: balanceError } = await supabase
              .from('user_profiles')
              .update({
                credits_balance: newBalance,
                updated_at: now
              })
              .eq('id', userProfile.id);

            if (balanceError) throw new Error(balanceError.message);

            // Update transaction with balance info
            await supabase
              .from('credit_transactions')
              .update({
                status: 'completed',
                previous_balance: currentBalance,
                new_balance: newBalance,
                processed_at: now,
              })
              .eq('id', creditTransaction.id);
          }
        }

        await logAdminAction(
          isApproval ? 'approve_credit' : 'reject_credit',
          'credit_transaction',
          creditTransaction.id.toString(),
          `${isApproval ? 'Approved' : 'Rejected'} credit request: ${notes}`
        );

      } else {
        const order = selectedItem as Order;

        // Update order status
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: isApproval ? 'processing' : 'cancelled',
            admin_notes: notes,
            processed_at: now,
          })
          .eq('id', order.id);

        if (updateError) throw new Error(updateError.message);

        await logAdminAction(
          isApproval ? 'approve_order' : 'reject_order',
          'order',
          order.id.toString(),
          `${isApproval ? 'Approved' : 'Rejected'} order: ${notes}`
        );
      }

      toast({
        title: 'Success',
        description: `Request ${isApproval ? 'approved' : 'rejected'} successfully`
      });

      setIsDialogOpen(false);
      setNotes('');
      fetchApprovalItems();
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openApprovalDialog = (item: ApprovalItem, type: ApprovalType, action: 'approve' | 'reject') => {
    setSelectedItem(item);
    setApprovalType(type);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <CheckSquare className="h-5 w-5 md:h-6 md:w-6" />
            <span>Approval Workflows</span>
          </CardTitle>
          <CardDescription className="text-sm md:text-base">Review and approve pending credit purchases and orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credits" className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-none md:flex">
              <TabsTrigger value="credits" className="flex items-center space-x-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Credit Requests</span>
                <span className="sm:hidden">Credits</span>
                <span>({creditRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2 text-sm">
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Order Approvals</span>
                <span className="sm:hidden">Orders</span>
                <span>({orderRequests.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Credit Requests Tab */}
            <TabsContent value="credits">
              {creditRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending credit requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">User ID: {request.user_id}</div>
                              <div className="text-sm text-gray-500">{request.transaction_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{request.credit_amount} Credits</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.payment_method}</Badge>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {request.payment_reference}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDate(request.created_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openApprovalDialog(request, 'credit', 'approve')}
                                className="w-full md:w-auto"
                              >
                                <Check className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Approve</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openApprovalDialog(request, 'credit', 'reject')}
                                className="w-full md:w-auto"
                              >
                                <X className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Reject</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Order Requests Tab */}
            <TabsContent value="orders">
              {orderRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending order approvals</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderRequests.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">#{order.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">User ID: {order.user_id}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">Product #{order.product_id}</div>
                              <div className="text-sm text-gray-500">
                                {order.operator}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{order.total_price} {order.currency}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{order.phone_number}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDate(order.created_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openApprovalDialog(order, 'order', 'approve')}
                                className="w-full md:w-auto"
                              >
                                <Check className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Approve</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openApprovalDialog(order, 'order', 'reject')}
                                className="w-full md:w-auto"
                              >
                                <X className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Reject</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} {approvalType === 'credit' ? 'Credit Request' : 'Order'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <div className="mt-4">
                  <p>ID: #{selectedItem.id}</p>
                  {approvalType === 'credit' && (
                    <p>Credits: {(selectedItem as CreditTransaction).credit_amount}</p>
                  )}
                  {approvalType === 'order' && (
                    <p>Amount: {(selectedItem as Order).total_price} {(selectedItem as Order).currency}</p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder={`Enter notes for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              disabled={isProcessing}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing ? (
                <LoadingSpinner className="w-4 h-4 mr-2" />
              ) : actionType === 'approve' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}