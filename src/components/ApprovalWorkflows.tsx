import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Package, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ProductApproval {
  id: number;
  name: string;
  status: string;
  admin_notes: string;
  category: string;
  operator: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentRequest {
  id: number;
  user_id: string;
  credits_requested: number;
  total_cost_mmk: number;
  payment_method: string;
  status: string;
  admin_notes: string;
  created_at: string;
  processed_at: string;
}

export default function ApprovalWorkflows() {
  const [productApprovals, setProductApprovals] = useState<ProductApproval[]>([]);
  const [creditRequests, setCreditRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalData();
  }, []);

  const fetchApprovalData = async () => {
    try {
      setLoading(true);

      // Fetch product approval workflows (approved/rejected)
      const { data: productWorkflows, error: productWfError } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('workflow_type', 'product')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });

      if (productWfError) throw productWfError;

      // Fetch payment requests (credit approvals)
      const { data: payments, error: paymentError } = await supabase
        .from('payment_requests')
        .select('*')
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      // Fetch related products and merge with workflows
      const productIds = Array.from(new Set((productWorkflows || []).map((wf: any) => wf.target_id)));
      let productsById: Record<number, any> = {};
      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
        if (productsError) throw productsError;
        productsById = (productsData || []).reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      const transformedProducts = (productWorkflows || []).map((wf: any) => {
        const p = productsById[wf.target_id] || {};
        return {
          id: wf.id, // workflow id
          name: p.name || `Product #${wf.target_id}`,
          status: wf.status,
          admin_notes: wf.admin_notes || '',
          category: p.category || '-',
          operator: p.operator || '-',
          price: p.price || 0,
          is_active: p.is_active ?? false,
          created_at: wf.created_at,
          updated_at: wf.processed_at || wf.created_at,
        } as ProductApproval;
      });

      setProductApprovals(transformedProducts);
      setCreditRequests(payments || []);
    } catch (error) {
      console.error('Error fetching approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'approved' ? 'default' : 'destructive';
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckSquare className="h-5 w-5" />
            Approval Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-white/70">
            <p>Loading approval data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CheckSquare className="h-5 w-5" />
          Approval Workflows
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="credit" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Credit Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Product Approvals</h3>
              {productApprovals.length === 0 ? (
                <div className="text-center py-8 text-white/70">
                  <Package className="h-8 w-8 mx-auto mb-2 text-white/50" />
                  <p>No product approvals found</p>
                </div>
              ) : (
                <div className="rounded-md border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/10">
                        <TableHead className="text-white/70">ID</TableHead>
                        <TableHead className="text-white/70">Product Name</TableHead>
                        <TableHead className="text-white/70">Category</TableHead>
                        <TableHead className="text-white/70">Operator</TableHead>
                        <TableHead className="text-white/70">Price</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                        <TableHead className="text-white/70">Created</TableHead>
                        <TableHead className="text-white/70">Last Updated</TableHead>
                        <TableHead className="text-white/70">Admin Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productApprovals.map((approval) => (
                        <TableRow key={approval.id} className="border-b border-white/10">
                          <TableCell className="text-white">{approval.id}</TableCell>
                          <TableCell className="text-white">{approval.name}</TableCell>
                          <TableCell className="text-white capitalize">{approval.category}</TableCell>
                          <TableCell className="text-white">{approval.operator}</TableCell>
                          <TableCell className="text-white">{approval.price} MMK</TableCell>
                          <TableCell>{getStatusBadge(approval.status)}</TableCell>
                          <TableCell className="text-white">
                            {formatDate(approval.created_at)}
                          </TableCell>
                          <TableCell className="text-white">
                            {formatDate(approval.updated_at)}
                          </TableCell>
                          <TableCell className="text-white max-w-xs truncate">
                            {approval.admin_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="credit" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Credit Payment Requests</h3>
              {creditRequests.length === 0 ? (
                <div className="text-center py-8 text-white/70">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-white/50" />
                  <p>No credit requests found</p>
                </div>
              ) : (
                <div className="rounded-md border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/10">
                        <TableHead className="text-white/70">ID</TableHead>
                        <TableHead className="text-white/70">User ID</TableHead>
                        <TableHead className="text-white/70">Credits</TableHead>
                        <TableHead className="text-white/70">Amount (MMK)</TableHead>
                        <TableHead className="text-white/70">Payment Method</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                        <TableHead className="text-white/70">Created</TableHead>
                        <TableHead className="text-white/70">Processed</TableHead>
                        <TableHead className="text-white/70">Admin Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditRequests.map((request) => (
                        <TableRow key={request.id} className="border-b border-white/10">
                          <TableCell className="text-white">{request.id}</TableCell>
                          <TableCell className="text-white font-mono text-xs">
                            {request.user_id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-white">{request.credits_requested}</TableCell>
                          <TableCell className="text-white">{request.total_cost_mmk.toLocaleString()}</TableCell>
                          <TableCell className="text-white capitalize">{request.payment_method}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-white">
                            {formatDate(request.created_at)}
                          </TableCell>
                          <TableCell className="text-white">
                            {request.processed_at ? formatDate(request.processed_at) : '-'}
                          </TableCell>
                          <TableCell className="text-white max-w-xs truncate">
                            {request.admin_notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}