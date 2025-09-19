import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Ban, UserCheck, CreditCard, Shield, UserMinus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string;
  credits_balance: number;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogType, setDialogType] = useState<'credits' | 'purge' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [creditForm, setCreditForm] = useState({
    amount: 0,
    type: 'add', // 'add' or 'deduct'
    reason: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw new Error(error.message);
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logAdminAction = async (actionType: string, targetId: string, notes: string, oldValues?: any, newValues?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('admin_audit_logs')
        .insert({
          admin_user_id: user?.id || null,
          action_type: actionType,
          target_type: 'user',
          target_id: targetId,
          old_values: oldValues ? JSON.stringify(oldValues) : '',
          new_values: newValues ? JSON.stringify(newValues) : '',
          ip_address: '',
          user_agent: navigator.userAgent,
          notes,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const handleCreditAdjustment = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const currentBalance = selectedUser.credits_balance || 0;
      const adjustment = creditForm.type === 'add' ? creditForm.amount : -creditForm.amount;
      const newBalance = Math.max(0, currentBalance + adjustment);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          credits_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw new Error(error.message);

      // Create credit transaction record
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.user_id,
          transaction_type: creditForm.type === 'add' ? 'admin_add' : 'admin_deduct',
          credit_amount: Math.abs(adjustment),
          currency: 'MMK',
          status: 'completed',
          payment_method: 'admin_adjustment',
          payment_reference: `ADMIN-${Date.now()}`,
          previous_balance: currentBalance,
          new_balance: newBalance,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          admin_notes: creditForm.reason
        });

      await logAdminAction(
        creditForm.type === 'add' ? 'add_credits' : 'deduct_credits',
        selectedUser.user_id,
        `${creditForm.type === 'add' ? 'Added' : 'Deducted'} ${creditForm.amount} credits: ${creditForm.reason}`,
        { credits_balance: currentBalance },
        { credits_balance: newBalance }
      );

      toast({
        title: 'Success',
        description: `Credits ${creditForm.type === 'add' ? 'added' : 'deducted'} successfully`
      });

      setIsDialogOpen(false);
      setCreditForm({ amount: 0, type: 'add', reason: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to adjust credits:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust credits',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      await logAdminAction('delete_user', user.user_id, `Deleted user: ${user.full_name || user.email}`);

      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });

      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const openDialog = (user: UserProfile, type: 'credits' | 'purge') => {
    setSelectedUser(user);
    setDialogType(type);
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
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Manage user accounts, credits, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Credits Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.full_name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.credits_balance?.toLocaleString() || 0} MMK
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(user, 'credits')}
                            className="w-full md:w-auto"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Credits
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full md:w-auto"
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user? This action cannot be undone and will remove all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Adjustment Dialog */}
      <Dialog open={isDialogOpen && dialogType === 'credits'} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust User Credits</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <div className="mt-4">
                  <p><strong>User:</strong> {selectedUser.full_name || selectedUser.email}</p>
                  <p><strong>Current Balance:</strong> {selectedUser.credits_balance?.toLocaleString() || 0} MMK</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="adjustment-type">Action</Label>
              <select
                id="adjustment-type"
                value={creditForm.type}
                onChange={(e) => setCreditForm({ ...creditForm, type: e.target.value as 'add' | 'deduct' })}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="add">Add Credits</option>
                <option value="deduct">Deduct Credits</option>
              </select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={creditForm.amount || ''}
                onChange={(e) => setCreditForm({ ...creditForm, amount: Number(e.target.value) || 0 })}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={creditForm.reason}
                onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                placeholder="Enter reason for adjustment..."
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
              onClick={handleCreditAdjustment}
              disabled={isProcessing || !creditForm.amount || !creditForm.reason}
            >
              {isProcessing ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {creditForm.type === 'add' ? 'Add Credits' : 'Deduct Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}