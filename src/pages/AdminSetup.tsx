
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface UserInfo {
  ID: number;
  Name: string;
  Email: string;
  CreateTime: string;
}

export default function AdminSetup() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);

  useEffect(() => {
    checkCurrentState();
  }, []);

  const checkCurrentState = async () => {
    try {
      // Get current user
      const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) throw new Error(userError);
      if (!userInfo) throw new Error('Please log in first');
      
      setUser(userInfo);

      // Check if user already has admin role
      const { data: rolesData, error: rolesError } = await window.ezsite.apis.tablePage(44174, {
        PageNo: 1,
        PageSize: 10,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userInfo.ID },
          { name: 'role_name', op: 'Equal', value: 'admin' },
          { name: 'is_active', op: 'Equal', value: true }
        ]
      });

      if (rolesError) throw new Error(rolesError);
      setHasAdminRole(rolesData?.List && rolesData.List.length > 0);
      
    } catch (error) {
      console.error('Setup check error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to check admin status'
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdminRole = async () => {
    if (!user) return;
    
    setCreating(true);
    try {
      const { error } = await window.ezsite.apis.tableCreate(44174, {
        user_id: user.ID,
        role_name: 'admin',
        permissions: JSON.stringify(['full_access']),
        granted_by: user.ID,
        granted_at: new Date().toISOString(),
        is_active: true
      });

      if (error) throw new Error(error);

      toast({
        title: "Success!",
        description: "Admin role created successfully. You can now access the admin panel."
      });

      setHasAdminRole(true);
      
    } catch (error) {
      console.error('Create admin role error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create admin role'
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Set up admin privileges for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Current User:</p>
              <p className="font-medium">{user.Name}</p>
              <p className="text-sm text-gray-500">{user.Email}</p>
            </div>
          )}

          {hasAdminRole ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You already have admin privileges! You can access the admin panel.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have admin privileges yet. Click below to grant yourself admin access.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={createAdminRole}
                disabled={creating}
                className="w-full"
              >
                {creating && <LoadingSpinner size="sm" className="mr-2" />}
                Create Admin Role
              </Button>
            </div>
          )}

          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
