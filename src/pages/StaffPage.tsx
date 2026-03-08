import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Staff as StaffType } from '@/types';
import { Plus, Search, Edit2, Trash2, X, User, ArrowLeft } from 'lucide-react';

const roles = ['teacher','driver','guard','cleaner','administrator'] as const;

const StaffPage = () => {
  const { t } = useLanguage();
  const { schools, staffList, addStaff, updateStaff, deleteStaff } = useData();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StaffType | null>(null);
  const [viewStaff, setViewStaff] = useState<StaffType | null>(null);
  const [form, setForm] = useState({ name: '', role: roles[0] as string, phone: '', salary: '', schoolId: '' });

  const filtered = staffList.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  const openAdd = () => {
    setForm({ name: '', role: roles[0], phone: '', salary: '', schoolId: schools[0]?.id || '' });
    setEditing(null); setShowForm(true);
  };
  const openEdit = (s: StaffType) => {
    setForm({ name: s.name, role: s.role, phone: s.phone, salary: String(s.salary), schoolId: s.schoolId });
    setEditing(s); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.schoolId) return;
    const data = { ...form, salary: Number(form.salary) || 0 };
    if (editing) updateStaff({ ...editing, ...data });
    else addStaff(data);
    setShowForm(false);
  };

  if (viewStaff) {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setViewStaff(null)} className="flex items-center gap-2 text-primary text-sm font-medium"><ArrowLeft size={16} />{t('staff')}</button>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full"><User size={24} className="text-primary" /></div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{viewStaff.name}</h2>
              <p className="text-xs text-muted-foreground">{t(viewStaff.role as any)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">{t('salary')}</span><p className="font-medium text-foreground">؋{viewStaff.salary.toLocaleString()}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('phone')}</span><p className="font-medium text-foreground">{viewStaff.phone}</p></div>
            <div className="col-span-2"><span className="text-muted-foreground text-xs">{t('school')}</span><p className="font-medium text-foreground">{schoolName(viewStaff.schoolId)}</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground" />
        </div>
        <button onClick={openAdd} className="bg-primary text-primary-foreground p-2.5 rounded-xl"><Plus size={20} /></button>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-3">
        {filtered.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm" onClick={() => setViewStaff(s)}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{t(s.role as any)} · {schoolName(s.schoolId)}</p>
                <p className="text-xs font-medium text-primary">؋{s.salary.toLocaleString()}/mo</p>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
                <button onClick={() => { if (confirm(t('confirm'))) deleteStaff(s.id); }} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{editing ? t('editStaff') : t('addStaff')}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('school')}</label>
              <select value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                <option value="">{t('filterBySchool')}</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('name')}</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('role')}</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                {roles.map(r => <option key={r} value={r}>{t(r as any)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('phone')}</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('salary')}</label>
              <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
