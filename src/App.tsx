import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthSuccess from "./pages/AuthSuccess";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminSetup from "./pages/AdminSetup";
import QuickAdminSetup from "./pages/QuickAdminSetup";
import NotFound from "./pages/NotFound";
import SupabaseTest from "./components/SupabaseTest";
import ErrorBoundary from "./components/ErrorBoundary";
import { toast } from "@/hooks/use-toast";

// Create QueryClient with better error handling and retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        toast({
          title: "Something went wrong",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive"
        });
      }
    }
  }
});

const App = () =>
<ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onauthsuccess" element={<AuthSuccess />} />
            <Route path="/test-supabase" element={<SupabaseTest />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/quick-admin-setup" element={<QuickAdminSetup />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>;



export default App;