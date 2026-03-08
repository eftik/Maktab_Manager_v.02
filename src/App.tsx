import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import HomePage from "@/pages/HomePage";
import SchoolsPage from "@/pages/SchoolsPage";
import StudentsPage from "@/pages/StudentsPage";
import FeesPage from "@/pages/FeesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ReportsPage from "@/pages/ReportsPage";
import StaffPage from "@/pages/StaffPage";
import SettingsPage from "@/pages/SettingsPage";
import AdminsPage from "@/pages/AdminsPage";
import LoginPage from "@/pages/LoginPage";
import SetupPage from "@/pages/SetupPage";

const queryClient = new QueryClient();

const pages: Record<string, React.FC> = {
  '/': HomePage,
  '/schools': SchoolsPage,
  '/students': StudentsPage,
  '/fees': FeesPage,
  '/expenses': ExpensesPage,
  '/reports': ReportsPage,
  '/staff': StaffPage,
  '/settings': SettingsPage,
  '/admins': AdminsPage,
};

const ownerOnlyPages = ['/reports', '/admins'];

const AuthenticatedApp = () => {
  const { user, admin, loading, isOwner } = useAuth();
  const [path, setPath] = useState('/');
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    checkOwnerExists();
  }, []);

  const checkOwnerExists = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-owner-exists');
      if (error) throw error;
      setOwnerExists(data?.exists ?? false);
    } catch {
      setOwnerExists(false);
    }
  };

  if (loading || ownerExists === null) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No owner yet → show setup
  if (!ownerExists) {
    return <SetupPage onComplete={() => { setOwnerExists(true); }} />;
  }

  if (!user || !admin) {
    return <LoginPage />;
  }

  const effectivePath = (!isOwner && ownerOnlyPages.includes(path)) ? '/' : path;
  const Page = pages[effectivePath] || HomePage;

  return (
    <DataProvider>
      <AppShell currentPath={effectivePath} onNavigate={setPath}>
        <Page />
      </AppShell>
    </DataProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
