import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Login from "./pages/Login";
import SuperAdmin from "./pages/SuperAdmin";
import Customers from "./pages/Customers";
import CustomerForm from "./pages/CustomerForm";
import PackageBuilder from "./pages/PackageBuilder";
import PackageForm from "./pages/PackageForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <div className="h-screen overflow-hidden bg-background">
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/license-management">
            <AuthProvider>
              <EnvironmentProvider>
                <Routes>
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />
                  <Route path="/super-admin/*" element={
                    <ProtectedRoute>
                      <SuperAdmin />
                    </ProtectedRoute>
                  } />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </EnvironmentProvider>
            </AuthProvider>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
