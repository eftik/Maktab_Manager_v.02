import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DataProvider } from "@/contexts/DataContext";
import { AppShell } from "@/components/AppShell";
import HomePage from "@/pages/HomePage";
import SchoolsPage from "@/pages/SchoolsPage";
import StudentsPage from "@/pages/StudentsPage";
import FeesPage from "@/pages/FeesPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ReportsPage from "@/pages/ReportsPage";
import StaffPage from "@/pages/StaffPage";
import SettingsPage from "@/pages/SettingsPage";

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
};

const App = () => {
  const [path, setPath] = useState('/');

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const Page = pages[path] || HomePage;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <LanguageProvider>
          <DataProvider>
            <AppShell currentPath={path} onNavigate={setPath}>
              <Page />
            </AppShell>
          </DataProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
