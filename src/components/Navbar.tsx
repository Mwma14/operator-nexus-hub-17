import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "./LoadingSpinner";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to check authentication status",
            variant: "destructive",
          });
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account",
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary font-space-grotesk">
              OPERATORS HUB
            </h1>
          </div>

          {/* Desktop Search - Center */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                className="pl-10 w-full bg-card border-border" />

            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : user ? (
              <Button
                onClick={handleLogout}
                variant="ghost"
                disabled={isLoggingOut}
                className="text-foreground hover:text-primary">
                {isLoggingOut ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" className="text-foreground hover:text-primary">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Buttons */}
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : user ? (
              <Button
                onClick={handleLogout}
                size="sm"
                disabled={isLoggingOut}
                variant="ghost">
                {isLoggingOut ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Join Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>);

};

export default Navbar;