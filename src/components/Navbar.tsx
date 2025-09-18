import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
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
                className="pl-10 w-full bg-card border-border"
              />
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                className="text-foreground hover:text-primary"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
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
            {user ? (
              <Button 
                onClick={handleLogout}
                size="sm" 
                variant="ghost"
              >
                <LogOut className="h-4 w-4" />
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
    </nav>
  );
};

export default Navbar;