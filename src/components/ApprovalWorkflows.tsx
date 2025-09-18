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

interface CreditTransaction {
  id: number;
  user_id: number;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_reference: string;
  payment_proof: string;
  approved_by: number;
  approval_notes: string;
  previous_balance: number;
  new_balance: number;
  processed_at: string;
  created_at: string;
  admin_notes: string;
}

interface Order {
  id: number;
  user_id: number;
  product_id: string;
  product_name: string;
  product_description: string;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  approval_status: string;
  operator: string;
  category: string;
  customer_phone: string;
  transaction_id: string;
  approved_by: number;
  approval_notes: string;
  processed_at: string;
  created_at: string;
  notes: string;
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
      const { data: creditData, error: creditError } = await window.ezsite.apis.tablePage(44176, {
        PageNo: 1,
        PageSize: 1000,
        Filters: [{ name: 'status', op: 'Equal', value: 'pending' }],
        OrderByField: 'created_at',
        IsAsc: false
      });

      if (creditError) throw new Error(creditError);
      setCreditRequests(creditData?.List || []);

      // Fetch pending orders
      const { data: orderData, error: orderError } = await window.ezsite.apis.tablePage(44175, {
        PageNo: 1,
        PageSize: 1000,
        Filters: [{ name: 'approval_status', op: 'Equal', value: 'pending' }],
        OrderByField: 'created_at',
        IsAsc: false
      });

      if (orderError) throw new Error(orderError);
      setOrderRequests(orderData?.List || []);
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
      await window.ezsite.apis.tableCreate(44177, {
        admin_user_id: 1, // This should be the current admin's ID
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
        const { error: updateError } = await window.ezsite.apis.tableUpdate(44176, {
          id: creditTransaction.id,
          ...creditTransaction,
          status: isApproval ? 'approved' : 'rejected',
          approved_by: 1, // Current admin ID
          approval_notes: notes,
          processed_at: now,
          updated_at: now
        });

        if (updateError) throw new Error(updateError);

        // If approved, update user's credit balance
        if (isApproval) {
          // First get current user profile
          const { data: userProfiles, error: userError } = await window.ezsite.apis.tablePage(44173, {
            PageNo: 1,
            PageSize: 1,
            Filters: [{ name: 'user_id', op: 'Equal', value: creditTransaction.user_id }]
          });

          if (userError) throw new Error(userError);

          const userProfile = userProfiles?.List?.[0];
          if (userProfile) {
            const currentBalance = userProfile.credits_balance || 0;
            const newBalance = currentBalance + creditTransaction.amount;

            const { error: balanceError } = await window.ezsite.apis.tableUpdate(44173, {
              id: userProfile.id,
              ...userProfile,
              credits_balance: newBalance,
              updated_at: now
            });

            if (balanceError) throw new Error(balanceError);

            // Update transaction with balance info
            await window.ezsite.apis.tableUpdate(44176, {
              id: creditTransaction.id,
              ...creditTransaction,
              status: 'completed',
              previous_balance: currentBalance,
              new_balance: newBalance,
              processed_at: now,
              updated_at: now
            });
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

        // Update order approval status
        const { error: updateError } = await window.ezsite.apis.tableUpdate(44175, {
          id: order.id,
          ...order,
          approval_status: isApproval ? 'approved' : 'rejected',
          status: isApproval ? 'processing' : 'cancelled',
          approved_by: 1, // Current admin ID
          approval_notes: notes,
          processed_at: now,
          updated_at: now
        });

        if (updateError) throw new Error(updateError);

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
      </div>);

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
              {creditRequests.length === 0 ?
              <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending credit requests</p>
                </div> :

              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Proof</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditRequests.map((request) =>
                    <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">User ID: {request.user_id}</div>
                              <div className="text-sm text-gray-500">{request.transaction_type}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{request.amount} {request.currency}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.payment_method}</Badge>
                          </TableCell>
                          <TableCell className="max-w-32 truncate">
                            {request.payment_reference}
                          </TableCell>
                          <TableCell>
                            {request.payment_proof ?
                        <Button variant="outline" size="sm" asChild>
                                <a href={request.payment_proof} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4" />
                                </a>
                              </Button> :

                        <span className="text-gray-400">No proof</span>
                        }
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
                            className="w-full md:w-auto">

                                <Check className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Approve</span>
                              </Button>
                              <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openApprovalDialog(request, 'credit', 'reject')}
                            className="w-full md:w-auto">

                                <X className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Reject</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                  </Table>
                </div>
              }
            </TabsContent>

            {/* Order Requests Tab */}
            <TabsContent value="orders">
              {orderRequests.length === 0 ?
              <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending order approvals</p>
                </div> :

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
                      {orderRequests.map((order) =>
                    <TableRow key={order.id}>
                          <TableCell>
                            <div className="font-medium">#{order.id}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">User ID: {order.user_id}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.product_name}</div>
                              <div className="text-sm text-gray-500">
                                {order.operator} • {order.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{order.amount} {order.currency}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{order.customer_phone}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Badge variant="secondary">{order.status}</Badge>
                              <Badge variant="outline">{order.payment_status}</Badge>
                            </div>
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
                            className="w-full md:w-auto">

                                <Check className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Approve</span>
                              </Button>
                              <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openApprovalDialog(order, 'order', 'reject')}
                            className="w-full md:w-auto">

                                <X className="h-4 w-4 md:mr-0" />
                                <span className="md:hidden ml-2">Reject</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                  </Table>
                </div>
              }
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
              {actionType === 'approve' ? 'Approve' : 'Reject'} this {approvalType === 'credit' ? 'credit purchase request' : 'order'} and provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedItem &&
            <div className="space-y-4">
                {/* Request Details */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  {approvalType === 'credit' ?
                <>
                      <div><strong>User ID:</strong> {(selectedItem as CreditTransaction).user_id}</div>
                      <div><strong>Amount:</strong> {(selectedItem as CreditTransaction).amount} {(selectedItem as CreditTransaction).currency}</div>
                      <div><strong>Payment Method:</strong> {(selectedItem as CreditTransaction).payment_method}</div>
                      <div><strong>Reference:</strong> {(selectedItem as CreditTransaction).payment_reference}</div>
                    </> :

                <>
                      <div><strong>Order ID:</strong> #{(selectedItem as Order).id}</div>
                      <div><strong>User ID:</strong> {(selectedItem as Order).user_id}</div>
                      <div><strong>Product:</strong> {(selectedItem as Order).product_name}</div>
                      <div><strong>Amount:</strong> {(selectedItem as Order).amount} {(selectedItem as Order).currency}</div>
                      <div><strong>Phone:</strong> {(selectedItem as Order).customer_phone}</div>
                    </>
                }
                </div>

                {/* Notes Input */}
                <div>
                  <Label htmlFor="approval-notes">
                    {actionType === 'approve' ? 'Approval' : 'Rejection'} Notes
                  </Label>
                  <Textarea
                  id="approval-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Enter reason for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                  className="mt-1" />

                </div>
              </div>
            }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApproval}
              disabled={isProcessing || !notes.trim()}
              variant={actionType === 'approve' ? 'default' : 'destructive'}>

              {isProcessing ? <LoadingSpinner size="sm" /> : null}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}