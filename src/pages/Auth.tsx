import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userResponse = await window.ezsite.apis.getUserInfo();
        if (!userResponse.error) {
          navigate("/");
        }
      } catch (error) {
























        // User not authenticated, stay on auth page
      }};checkUser();}, [navigate]);const handleSignUp = async (e: React.FormEvent) => {e.preventDefault();if (!email || !password || !name) {toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });return;}setLoading(true);try {const response = await window.ezsite.apis.register({ email, password, name });
      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "Please check your email to confirm your account"
      });

      // Clear form
      setEmail("");
      setPassword("");
      setName("");
    } catch (error: any) {
      toast({
        title: "Sign Up Error",
        description: error.message || "An error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.ezsite.apis.login({
        email,
        password
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: "You have been successfully signed in"
      });

      // Navigate to home page
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await window.ezsite.apis.sendResetPwdEmail({
        email
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions"
      });
      setIsResetMode(false);
    } catch (error: any) {
      toast({
        title: "Reset Password Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-8">
        <div className="absolute inset-0 mesh-gradient">
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
          <div className="floating-orb"></div>
        </div>
        
        <Card className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px] glass-card relative z-10 mx-3 sm:mx-0">
          <CardHeader className="space-y-1 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsResetMode(false)}
                className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary font-space-grotesk leading-tight">
                OPERATORS HUB
              </h1>
            </div>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center">Reset Password</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base md:text-lg px-1 sm:px-2">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
            <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="reset-email" className="text-xs sm:text-sm font-medium">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base" />
              </div>
              <Button type="submit" className="w-full btn-premium h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Email"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 lg:p-8">
      <div className="absolute inset-0 mesh-gradient">
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
        <div className="floating-orb"></div>
      </div>
      
      <Card className="w-full max-w-[340px] sm:max-w-[400px] md:max-w-[440px] lg:max-w-[480px] glass-card relative z-10 mx-3 sm:mx-0">
        <CardHeader className="space-y-1 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary font-space-grotesk leading-tight">
              OPERATORS HUB
            </h1>
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl text-center">Welcome</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base md:text-lg px-1 sm:px-2">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-12">
              <TabsTrigger value="signin" className="text-xs sm:text-sm md:text-base px-2">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm md:text-base px-2">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-0">
              <form onSubmit={handleSignIn} className="space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signin-email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base" />

                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signin-password" className="text-xs sm:text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 sm:h-12 pr-10 sm:pr-12 text-sm sm:text-base" />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 sm:h-12 sm:w-12 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}>

                      {showPassword ?
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> :

                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      }
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-premium h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-muted-foreground text-xs sm:text-sm h-8 sm:h-10"
                  onClick={() => setIsResetMode(true)}>

                  Forgot your password?
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-0">
              <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-5">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-name" className="text-xs sm:text-sm font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base" />

                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base" />

                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-10 sm:h-12 pr-10 sm:pr-12 text-sm sm:text-base" />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 sm:h-12 sm:w-12 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}>

                      {showPassword ?
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" /> :

                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      }
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-premium h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);

};

export default Auth;