import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ebooks from "./pages/Ebooks";
import Modules from "./pages/Modules";
import ModuleView from "./pages/ModuleView";
import ContentView from "./pages/ContentView";
import Blocked from "./pages/Blocked";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContents from "./pages/admin/AdminContents";
import AdminModules from "./pages/admin/AdminModules";
import AdminModuleContents from "./pages/admin/AdminModuleContents";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminClients from "./pages/admin/AdminClients";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blocked" element={<Blocked />} />

            {/* Member routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/videos" element={<Navigate to="/modules" replace />} />
            <Route path="/ebooks" element={<ProtectedRoute><Ebooks /></ProtectedRoute>} />
            <Route path="/modules" element={<ProtectedRoute><Modules /></ProtectedRoute>} />
            <Route path="/modules/:id" element={<ProtectedRoute><ModuleView /></ProtectedRoute>} />
            <Route path="/content/:id" element={<ProtectedRoute><ContentView /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/modules" element={<ProtectedRoute adminOnly><AdminModules /></ProtectedRoute>} />
            <Route path="/admin/modules/:moduleId/contents" element={<ProtectedRoute adminOnly><AdminModuleContents /></ProtectedRoute>} />
            <Route path="/admin/contents" element={<ProtectedRoute adminOnly><AdminContents /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute adminOnly><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute adminOnly><AdminClients /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
