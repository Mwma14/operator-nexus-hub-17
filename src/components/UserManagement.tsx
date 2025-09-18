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

interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  avatar_url: string;
  credits_balance: number;
  is_banned: boolean;
  ban_reason: string;
  ban_until: string;
  kyc_status: string;
  phone_verified: boolean;
  email_verified: boolean;
  last_login: string;
  created_at: string;
}

interface UserRole {
  id: number;
  user_id: number;
  role_name: string;
  permissions: string;
  granted_by: number;
  granted_at: string;
  expires_at: string;
  is_active: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogType, setDialogType] = useState<'ban' | 'credits' | 'role' | 'purge' | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [banForm, setBanForm] = useState({
    reason: '',
    until: ''
  });

  const [creditForm, setCreditForm] = useState({
    amount: 0,
    type: 'add', // 'add' or 'deduct'
    reason: ''
  });

  const [roleForm, setRoleForm] = useState({
    role_name: '',
    expires_at: ''
  });

  const roleOptions = ['admin', 'moderator', 'support'];

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toString().includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(44173, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'created_at',
        IsAsc: false
      });

      if (error) throw new Error(error);
      setUsers(data?.List || []);
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

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(44174, {
        PageNo: 1,
        PageSize: 1000,
        Filters: [{ name: 'is_active', op: 'Equal', value: true }]
      });

      if (error) throw new Error(error);
      setUserRoles(data?.List || []);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    }
  };

  const logAdminAction = async (actionType: string, targetId: string, notes: string, oldValues?: any, newValues?: any) => {
    try {
      await window.ezsite.apis.tableCreate(44177, {
        admin_user_id: 1, // This should be the current admin's ID
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

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const banUntil = banForm.until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days

      const { error } = await window.ezsite.apis.tableUpdate(44173, {
        id: selectedUser.id,
        ...selectedUser,
        is_banned: true,
        ban_reason: banForm.reason,
        ban_until: banUntil,
        updated_at: new Date().toISOString()
      });

      if (error) throw new Error(error);

      await logAdminAction('ban_user', selectedUser.user_id.toString(), `Banned user: ${banForm.reason}`,
      { is_banned: selectedUser.is_banned },
      { is_banned: true, ban_reason: banForm.reason, ban_until: banUntil }
      );

      toast({
        title: 'Success',
        description: 'User has been banned successfully'
      });

      setIsDialogOpen(false);
      setBanForm({ reason: '', until: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to ban user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to ban user',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanUser = async (user: UserProfile) => {
    try {
      const { error } = await window.ezsite.apis.tableUpdate(44173, {
        id: user.id,
        ...user,
        is_banned: false,
        ban_reason: '',
        ban_until: '',
        updated_at: new Date().toISOString()
      });

      if (error) throw new Error(error);

      await logAdminAction('unban_user', user.user_id.toString(), 'Unbanned user');

      toast({
        title: 'Success',
        description: 'User has been unbanned successfully'
      });

      fetchUsers();
    } catch (error) {
      console.error('Failed to unban user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unban user',
        variant: 'destructive'
      });
    }
  };

  const handleCreditOperation = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);
      const currentBalance = selectedUser.credits_balance || 0;
      const operation = creditForm.type === 'add' ? creditForm.amount : -creditForm.amount;
      const newBalance = Math.max(0, currentBalance + operation);

      // Update user profile
      const { error: updateError } = await window.ezsite.apis.tableUpdate(44173, {
        id: selectedUser.id,
        ...selectedUser,
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      });

      if (updateError) throw new Error(updateError);

      // Log credit transaction
      const { error: transactionError } = await window.ezsite.apis.tableCreate(44176, {
        user_id: selectedUser.user_id,
        transaction_type: creditForm.type === 'add' ? 'bonus' : 'deduction',
        amount: creditForm.amount,
        currency: 'MMK',
        status: 'completed',
        payment_method: 'admin_adjustment',
        payment_reference: `Admin adjustment - ${creditForm.reason}`,
        approved_by: 1, // Current admin ID
        approval_notes: creditForm.reason,
        previous_balance: currentBalance,
        new_balance: newBalance,
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_notes: creditForm.reason
      });

      if (transactionError) throw new Error(transactionError);

      await logAdminAction('credit_adjustment', selectedUser.user_id.toString(),
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
      console.error('Failed to update credits:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update credits',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoleOperation = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);

      // Check if user already has this role
      const existingRole = userRoles.find((role) =>
      role.user_id === selectedUser.user_id &&
      role.role_name === roleForm.role_name &&
      role.is_active
      );

      if (existingRole) {
        toast({
          title: 'Info',
          description: 'User already has this role',
          variant: 'default'
        });
        return;
      }

      // Create new role
      const { error } = await window.ezsite.apis.tableCreate(44174, {
        user_id: selectedUser.user_id,
        role_name: roleForm.role_name,
        permissions: JSON.stringify([]),
        granted_by: 1, // Current admin ID
        granted_at: new Date().toISOString(),
        expires_at: roleForm.expires_at || '',
        is_active: true
      });

      if (error) throw new Error(error);

      await logAdminAction('grant_role', selectedUser.user_id.toString(),
      `Granted ${roleForm.role_name} role`
      );

      toast({
        title: 'Success',
        description: `${roleForm.role_name} role granted successfully`
      });

      setIsDialogOpen(false);
      setRoleForm({ role_name: '', expires_at: '' });
      fetchUserRoles();
    } catch (error) {
      console.error('Failed to grant role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to grant role',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeUser = async () => {
    if (!selectedUser) return;

    try {
      setIsProcessing(true);

      // Delete user profile (this is a destructive action)
      const { error } = await window.ezsite.apis.tableDelete(44173, { id: selectedUser.id });

      if (error) throw new Error(error);

      await logAdminAction('purge_user', selectedUser.user_id.toString(),
      `Purged user data for ${selectedUser.full_name}`
      );

      toast({
        title: 'Success',
        description: 'User data has been purged successfully'
      });

      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to purge user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to purge user data',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDialog = (type: 'ban' | 'credits' | 'role' | 'purge', user: UserProfile) => {
    setSelectedUser(user);
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const getUserRole = (userId: number) => {
    const role = userRoles.find((role) => role.user_id === userId && role.is_active);
    return role?.role_name || null;
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>Manage users, credits, roles, and bans</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />

            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) =>
                <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{user.credits_balance} MMK</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge variant={user.is_banned ? "destructive" : "default"}>
                          {user.is_banned ? "Banned" : "Active"}
                        </Badge>
                        {user.is_banned && user.ban_reason &&
                      <span className="text-xs text-gray-500 max-w-32 truncate" title={user.ban_reason}>
                            {user.ban_reason}
                          </span>
                      }
                      </div>
                    </TableCell>
                    <TableCell>
                      {getUserRole(user.user_id) ?
                    <Badge variant="secondary">{getUserRole(user.user_id)}</Badge> :

                    <span className="text-gray-400">None</span>
                    }
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.kyc_status === 'approved' ? 'default' : user.kyc_status === 'rejected' ? 'destructive' : 'secondary'}>
                        {user.kyc_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {user.is_banned ?
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(user)}>

                            <UserCheck className="h-4 w-4" />
                          </Button> :

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog('ban', user)}>

                            <Ban className="h-4 w-4" />
                          </Button>
                      }
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog('credits', user)}>

                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog('role', user)}>

                          <Shield className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm User Data Purge</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to permanently delete all data for "{user.full_name}"? This action cannot be undone and will remove all user information, transactions, and orders.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                              onClick={() => openDialog('purge', user)}
                              className="bg-red-600 hover:bg-red-700">

                                Purge User Data
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 &&
          <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          }
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'ban' && 'Ban User'}
              {dialogType === 'credits' && 'Adjust Credits'}
              {dialogType === 'role' && 'Grant Role'}
              {dialogType === 'purge' && 'Purge User Data'}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'ban' && `Ban ${selectedUser?.full_name}`}
              {dialogType === 'credits' && `Adjust credit balance for ${selectedUser?.full_name}`}
              {dialogType === 'role' && `Grant administrative role to ${selectedUser?.full_name}`}
              {dialogType === 'purge' && `Permanently delete all data for ${selectedUser?.full_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {dialogType === 'ban' &&
            <div className="space-y-4">
                <div>
                  <Label htmlFor="ban-reason">Reason for ban</Label>
                  <Textarea
                  id="ban-reason"
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  placeholder="Enter reason for banning this user" />

                </div>
                <div>
                  <Label htmlFor="ban-until">Ban until (optional)</Label>
                  <Input
                  id="ban-until"
                  type="datetime-local"
                  value={banForm.until}
                  onChange={(e) => setBanForm({ ...banForm, until: e.target.value })} />

                </div>
              </div>
            }

            {dialogType === 'credits' &&
            <div className="space-y-4">
                <div>
                  <Label>Current Balance: {selectedUser?.credits_balance || 0} MMK</Label>
                </div>
                <div>
                  <Label htmlFor="credit-type">Operation</Label>
                  <select
                  id="credit-type"
                  value={creditForm.type}
                  onChange={(e) => setCreditForm({ ...creditForm, type: e.target.value as 'add' | 'deduct' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md">

                    <option value="add">Add Credits</option>
                    <option value="deduct">Deduct Credits</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="credit-amount">Amount (MMK)</Label>
                  <Input
                  id="credit-amount"
                  type="number"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: Number(e.target.value) })} />

                </div>
                <div>
                  <Label htmlFor="credit-reason">Reason</Label>
                  <Textarea
                  id="credit-reason"
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                  placeholder="Enter reason for credit adjustment" />

                </div>
              </div>
            }

            {dialogType === 'role' &&
            <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role</Label>
                  <select
                  id="role-name"
                  value={roleForm.role_name}
                  onChange={(e) => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md">

                    <option value="">Select Role</option>
                    {roleOptions.map((role) =>
                  <option key={role} value={role}>{role}</option>
                  )}
                  </select>
                </div>
                <div>
                  <Label htmlFor="role-expires">Expires At (optional)</Label>
                  <Input
                  id="role-expires"
                  type="datetime-local"
                  value={roleForm.expires_at}
                  onChange={(e) => setRoleForm({ ...roleForm, expires_at: e.target.value })} />

                </div>
              </div>
            }

            {dialogType === 'purge' &&
            <div className="text-center py-8">
                <UserMinus className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 font-semibold">
                  This will permanently delete all user data including:
                </p>
                <ul className="text-sm text-gray-600 mt-2 text-left max-w-sm mx-auto">
                  <li>• User profile and account information</li>
                  <li>• Credit transaction history</li>
                  <li>• Order history</li>
                  <li>• All associated records</li>
                </ul>
              </div>
            }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (dialogType === 'ban') handleBanUser();
                if (dialogType === 'credits') handleCreditOperation();
                if (dialogType === 'role') handleRoleOperation();
                if (dialogType === 'purge') handlePurgeUser();
              }}
              disabled={isProcessing}
              variant={dialogType === 'purge' ? 'destructive' : 'default'}>

              {isProcessing ? <LoadingSpinner size="sm" /> : null}
              {dialogType === 'ban' && 'Ban User'}
              {dialogType === 'credits' && 'Update Credits'}
              {dialogType === 'role' && 'Grant Role'}
              {dialogType === 'purge' && 'Purge Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}