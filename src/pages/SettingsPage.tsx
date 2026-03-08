import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Globe, Moon, Sun, RotateCcw, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/types';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const { isOwner } = useAuth();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [showReset, setShowReset] = useState(false);
  const [resetPasscode, setResetPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleResetApp = async () => {
    if (!resetPasscode) return;
    setResetLoading(true);
    setResetError('');
    try {
      const { data, error } = await supabase.functions.invoke('reset-app', {
        body: { masterPasscode: resetPasscode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Sign out and reload
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      setResetError(err.message || 'Reset failed');
    }
    setResetLoading(false);
  };

  const langs: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'da', label: 'دری' },
    { code: 'ps', label: 'پښتو' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg text-foreground">{t('settings')}</h2>

      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{t('language')}</span>
          </div>
          <div className="flex gap-1">
            {langs.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lang === l.code ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon size={20} className="text-muted-foreground" /> : <Sun size={20} className="text-muted-foreground" />}
            <span className="text-sm font-medium text-foreground">{t('darkMode')}</span>
          </div>
          <button onClick={() => setDark(!dark)}
            className={`w-12 h-7 rounded-full transition-colors relative ${dark ? 'bg-primary' : 'bg-muted'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all ${dark ? 'right-1' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Reset App — Owner only */}
      {isOwner && (
        <div className="bg-card border border-destructive/30 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowReset(!showReset)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <RotateCcw size={20} className="text-destructive" />
              <span className="text-sm font-medium text-destructive">{t('resetApp' as any)}</span>
            </div>
          </button>

          {showReset && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">{t('resetAppConfirm' as any)}</p>

              {resetError && (
                <div className="bg-destructive/10 text-destructive text-xs rounded-xl px-3 py-2 font-medium">
                  {resetError}
                </div>
              )}

              <div className="relative">
                <KeyRound size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={resetPasscode}
                  onChange={e => setResetPasscode(e.target.value)}
                  placeholder={t('masterPasscode' as any)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 ps-9 pe-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPasscode(!showPasscode)} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground">
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                onClick={handleResetApp}
                disabled={resetLoading || !resetPasscode}
                className="w-full bg-destructive text-destructive-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {resetLoading ? t('resetting' as any) : t('resetApp' as any)}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground">Maktab Manager v2.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made for Afghan Private Schools 🇦🇫</p>
      </div>
    </div>
  );
};
export default SettingsPage;
