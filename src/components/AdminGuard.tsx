import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Get current user info
        const { data: userInfo, error: userError } = await window.ezsite.apis.getUserInfo();
        if (userError) {
          throw new Error(userError);
        }

        if (!userInfo) {
          throw new Error('Please log in to access the admin panel');
        }

        // Check if user has admin role
        const { data: rolesData, error: rolesError } = await window.ezsite.apis.tablePage(44174, {
          PageNo: 1,
          PageSize: 10,
          Filters: [
          { name: 'user_id', op: 'Equal', value: userInfo.ID },
          { name: 'is_active', op: 'Equal', value: true },
          { name: 'role_name', op: 'Equal', value: 'admin' }]

        });

        if (rolesError) {
          throw new Error(rolesError);
        }

        if (!rolesData?.List || rolesData.List.length === 0) {
          throw new Error('Access denied. Admin privileges required.');
        }

        setIsAdmin(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Access denied');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>);

  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Access denied. Admin privileges required.'}
          </AlertDescription>
        </Alert>
      </div>);

  }

  return <>{children}</>;
}