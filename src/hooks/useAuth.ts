import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check admin status
          setTimeout(async () => {
            const { data: hasRole } = await supabase.rpc('has_role', {
              _user_id: session.user.id,
              _role: 'admin'
            });
            setIsAdmin(!!hasRole);
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        }).then(({ data: hasRole }) => {
          setIsAdmin(!!hasRole);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isAdmin
  };
};
