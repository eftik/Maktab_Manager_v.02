import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { Globe, Moon, Sun } from 'lucide-react';
import type { Language } from '@/types';

const SettingsPage = () => {
  const { t, lang, setLang } = useLanguage();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

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

      <div className="bg-card border border-border rounded-2xl p-4 text-center">
        <p className="text-xs text-muted-foreground">SchoolManager v2.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made for Afghan Private Schools 🇦🇫</p>
      </div>
    </div>
  );
};
export default SettingsPage;
