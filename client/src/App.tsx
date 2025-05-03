import { useEffect, ReactNode } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/dashboard/Dashboard";
import CustomersPage from "@/pages/customers/CustomersPage";
import CustomerForm from "@/pages/customers/CustomerForm";
import CustomerDetailPage from "@/pages/customers/CustomerDetailPage";
import PackagesPage from "@/pages/packages/PackagesPage";
import BandwidthPage from "@/pages/bandwidth/BandwidthPage";
import BillingPage from "@/pages/billing/BillingPage";
import TicketsPage from "@/pages/tickets/TicketsPage";
import TicketForm from "@/pages/tickets/TicketForm";
import RadiusPage from "@/pages/radius/RadiusPage";
import NetworkPage from "@/pages/network/NetworkPage";
import PbxPage from "@/pages/pbx/PbxPage";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import SettingsPage from "@/pages/settings/SettingsPage";
import RolesPage from "@/pages/roles/RolesPage";
import ActivityPage from "@/pages/activity/ActivityPage";
import LoginPage from "@/pages/auth/LoginPage";
import CustomerLoginPage from "@/pages/customer-portal/CustomerLoginPage";
import CustomerDashboard from "@/pages/customer-portal/CustomerDashboard";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useCustomerAuth, CustomerAuthProvider } from "@/hooks/use-customer-auth";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use useEffect to handle redirects to avoid React warning about
  // state updates during render
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Use useEffect to handle redirects to avoid React warning about
  // state updates during render
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (user.role !== 'admin') {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}

// Protected route for customer portal
function CustomerProtectedRoute({ children }: { children: ReactNode }) {
  const { customer, isLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !customer) {
      setLocation("/customer/login");
    }
  }, [customer, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!customer) {
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Admin login */}
      <Route path="/login">
        <LoginPage />
      </Route>
      
      {/* Customer portal routes */}
      <Route path="/customer/login">
        <CustomerLoginPage />
      </Route>
      
      <Route path="/customer">
        <CustomerProtectedRoute>
          <CustomerDashboard />
        </CustomerProtectedRoute>
      </Route>
      
      {/* Admin routes */}
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers">
        <ProtectedRoute>
          <Layout>
            <CustomersPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers/new">
        <ProtectedRoute>
          <Layout>
            <CustomerForm />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers/:id/edit">
        {(params) => (
          <ProtectedRoute>
            <Layout>
              <CustomerForm id={parseInt(params.id)} />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/customers/:id">
        {(params) => (
          <ProtectedRoute>
            <Layout>
              <CustomerDetailPage />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/packages">
        <ProtectedRoute>
          <Layout>
            <PackagesPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/bandwidth">
        <ProtectedRoute>
          <Layout>
            <BandwidthPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/billing">
        <ProtectedRoute>
          <Layout>
            <BillingPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/tickets">
        <ProtectedRoute>
          <Layout>
            <TicketsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/tickets/new">
        <ProtectedRoute>
          <Layout>
            <TicketForm />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/tickets/:id">
        {(params) => (
          <ProtectedRoute>
            <Layout>
              <TicketForm id={parseInt(params.id)} />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/radius">
        <AdminRoute>
          <Layout>
            <RadiusPage />
          </Layout>
        </AdminRoute>
      </Route>
      
      <Route path="/network">
        <ProtectedRoute>
          <Layout>
            <NetworkPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/pbx">
        <ProtectedRoute>
          <Layout>
            <PbxPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <Layout>
            <SettingsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/roles">
        <AdminRoute>
          <Layout>
            <RolesPage />
          </Layout>
        </AdminRoute>
      </Route>
      
      <Route path="/activity">
        <ProtectedRoute>
          <Layout>
            <ActivityPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute>
          <Layout>
            <AnalyticsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <OnboardingProvider>
              <Toaster />
              <AppRoutes />
            </OnboardingProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
