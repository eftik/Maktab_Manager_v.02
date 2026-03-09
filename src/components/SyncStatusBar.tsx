import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export const SyncStatusBar = () => {
  const { isOnline, pendingSyncCount, syncNow } = useData();
  const [syncing, setSyncing] = useState(false);
  const [showSynced, setShowSynced] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
    setShowSynced(true);
  };

  useEffect(() => {
    if (showSynced) {
      const t = setTimeout(() => setShowSynced(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showSynced]);

  // Only show when offline or has pending sync items
  if (isOnline && pendingSyncCount === 0 && !showSynced) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors",
        !isOnline
          ? "bg-destructive/10 text-destructive"
          : pendingSyncCount > 0
            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff size={14} />
          <span className="flex-1">Offline — changes saved locally</span>
          {pendingSyncCount > 0 && (
            <span className="bg-destructive/20 px-1.5 py-0.5 rounded-full text-[10px]">
              {pendingSyncCount} pending
            </span>
          )}
        </>
      ) : pendingSyncCount > 0 ? (
        <>
          <Wifi size={14} />
          <span className="flex-1">{pendingSyncCount} changes to sync</span>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-[10px] font-semibold disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </>
      ) : showSynced ? (
        <>
          <Check size={14} />
          <span>All changes synced ✓</span>
        </>
      ) : null}
    </div>
  );
};
