import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

// Lazy load all pages for faster initial bundle
const HomePage = lazy(() => import("@/pages/HomePage"));
const SchoolsPage = lazy(() => import("@/pages/SchoolsPage"));
const StudentsPage = lazy(() => import("@/pages/StudentsPage"));
const FeesPage = lazy(() => import("@/pages/FeesPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AdminsPage = lazy(() => import("@/pages/AdminsPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SetupPage = lazy(() => import("@/pages/SetupPage"));

const queryClient = new QueryClient();

const pages: Record<string, React.LazyExoticComponent<React.FC>> = {
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

const PageSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { user, admin, loading, isOwner } = useAuth();
  const [path, setPath] = useState('/');
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  // Check owner in parallel with auth (runs once on mount)
  useEffect(() => {
    supabase.rpc('owner_exists').then(({ data, error }) => {
      if (error) {
        // Fallback to edge function
        supabase.functions.invoke('check-owner-exists').then(({ data }) => {
          setOwnerExists(data?.exists ?? false);
        }).catch(() => setOwnerExists(false));
      } else {
        setOwnerExists(!!data);
      }
    });
  }, []);

  if (loading || ownerExists === null) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ownerExists) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <SetupPage onComplete={() => setOwnerExists(true)} />
      </Suspense>
    );
  }

  if (!user || !admin) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <LoginPage />
      </Suspense>
    );
  }

  const effectivePath = (!isOwner && ownerOnlyPages.includes(path)) ? '/' : path;
  const Page = pages[effectivePath] || HomePage;

  return (
    <DataProvider>
      <AppShell currentPath={effectivePath} onNavigate={setPath}>
        <Suspense fallback={<PageSpinner />}>
          <Page />
        </Suspense>
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
