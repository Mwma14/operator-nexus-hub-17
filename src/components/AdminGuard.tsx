import React, { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          throw new Error('Please log in to access the admin panel');
        }

        // Check if user has admin role in user_roles table
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) {
          console.error('Error checking admin role:', roleError);
          throw new Error('Failed to verify admin privileges');
        }

        if (!userRole) {
          throw new Error('Access denied. Admin privileges required. Please contact the administrator to grant you admin access.');
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