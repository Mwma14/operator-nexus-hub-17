import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Package, CheckSquare, Shield, ArrowLeft, Zap } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import ProductManagement from '@/components/ProductManagement';
import UserManagement from '@/components/UserManagement';
import ApprovalWorkflows from '@/components/ApprovalWorkflows';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen mesh-gradient relative overflow-hidden">
      {/* Floating gradient orbs */}
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>

      <div className="relative z-10">
        {/* Header with back button */}
        <div className="glass-card border-b border-white/10 px-6 py-4 mx-4 mt-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-amber-400" />
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            </div>
            <Button
              onClick={handleBack}
              variant="outline"
              size="sm"
              className="glass-card hover:bg-white/10 border-white/20 text-white hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto p-6">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="glass-card rounded-2xl p-1">
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-none">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-400 data-[state=active]:to-yellow-400 data-[state=active]:text-black text-white/70 hover:text-white transition-all rounded-xl"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="products" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-400 data-[state=active]:to-yellow-400 data-[state=active]:text-black text-white/70 hover:text-white transition-all rounded-xl"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Products</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-400 data-[state=active]:to-yellow-400 data-[state=active]:text-black text-white/70 hover:text-white transition-all rounded-xl"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="approvals" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:via-amber-400 data-[state=active]:to-yellow-400 data-[state=active]:text-black text-white/70 hover:text-white transition-all rounded-xl"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Approvals</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="products">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="approvals">
              <ApprovalWorkflows />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>);

}