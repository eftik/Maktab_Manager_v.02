import { ReactNode, useState } from 'react';
import { Home, School, Users, CreditCard, Receipt, BarChart3, UserCog, Settings, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'home', icon: Home, path: '/' },
  { key: 'schools', icon: School, path: '/schools' },
  { key: 'students', icon: Users, path: '/students' },
  { key: 'fees', icon: CreditCard, path: '/fees' },
  { key: 'expenses', icon: Receipt, path: '/expenses' },
  { key: 'reports', icon: BarChart3, path: '/reports' },
  { key: 'staff', icon: UserCog, path: '/staff' },
  { key: 'settings', icon: Settings, path: '/settings' },
] as const;

interface AppShellProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const AppShell = ({ children, currentPath, onNavigate }: AppShellProps) => {
  const { t, dir } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const bottomNav = navItems.slice(0, 5);
  const moreNav = navItems.slice(5);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-lg font-bold tracking-tight">🏫 SchoolManager</h1>
        <button onClick={() => setDrawerOpen(!drawerOpen)} className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors">
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <nav className={cn("fixed top-0 z-50 h-full w-64 bg-card shadow-xl p-4 pt-16 flex flex-col gap-1 transition-transform", dir === 'rtl' ? 'right-0' : 'left-0')}>
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.path); setDrawerOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  currentPath === item.path ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                )}
              >
                <item.icon size={20} />
                {t(item.key as any)}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* Content */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around py-1.5">
          {bottomNav.map(item => {
            const active = currentPath === item.path;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{t(item.key as any)}</span>
              </button>
            );
          })}
          {/* More button for remaining pages */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[56px]",
              moreNav.some(i => i.path === currentPath) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu size={20} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
