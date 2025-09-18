
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Shield, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function QuickAdminSetup() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_admin'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setupAdmin();
  }, []);

  const setupAdmin = async () => {
    try {
      // Get current user
      const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
      if (userError) throw new Error(userError);
      if (!userInfo) throw new Error('Please log in first');

      // Check if admin role already exists
      const { data: existingRole, error: checkError } = await window.ezsite.apis.tablePage(44174, {
        PageNo: 1,
        PageSize: 10,
        Filters: [
          { name: 'user_id', op: 'Equal', value: userInfo.ID },
          { name: 'role_name', op: 'Equal', value: 'admin' },
          { name: 'is_active', op: 'Equal', value: true }
        ]
      });

      if (checkError) throw new Error(checkError);

      if (existingRole && existingRole.List && existingRole.List.length > 0) {
        setStatus('already_admin');
        setMessage('You already have admin privileges!');
        return;
      }

      // Create admin role
      const { error: createError } = await window.ezsite.apis.tableCreate(44174, {
        user_id: userInfo.ID,
        role_name: 'admin',
        permissions: JSON.stringify(['full_access']),
        granted_by: userInfo.ID,
        granted_at: new Date().toISOString(),
        is_active: true
      });

      if (createError) throw new Error(createError);

      setStatus('success');
      setMessage('Admin role created successfully!');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/admin';
      }, 3000);

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Setup failed');
    }
  };

  const handleGoToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Quick Admin Setup</CardTitle>
          <CardDescription>
            Setting up admin access for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-600">Setting up admin privileges...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Redirecting to admin panel in 3 seconds...
                </p>
                <Button onClick={handleGoToAdmin} className="w-full">
                  Go to Admin Panel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {status === 'already_admin' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={handleGoToAdmin} className="w-full">
                Go to Admin Panel <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={setupAdmin} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
