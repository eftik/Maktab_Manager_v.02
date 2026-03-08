import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { School } from '@/types';
import { Plus, Search, Edit2, Trash2, X, MapPin, Phone, Users } from 'lucide-react';

const SchoolsPage = () => {
  const { t } = useLanguage();
  const { schools, students, addSchool, updateSchool, deleteSchool } = useData();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<School | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', phone: '', address: '' });

  const filtered = schools.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', city: '', phone: '', address: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (s: School) => { setForm({ name: s.name, city: s.city, phone: s.phone, address: s.address }); setEditing(s); setShowForm(true); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateSchool({ ...editing, ...form });
    } else {
      addSchool(form);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirm'))) deleteSchool(id);
  };

  const studentCount = (id: string) => students.filter(s => s.schoolId === id && s.status === 'active').length;

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
        {filtered.map(school => (
          <div key={school.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground">{school.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} />{school.city}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone size={12} />{school.phone}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users size={12} />{studentCount(school.id)} {t('students')}</div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(school)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(school.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{editing ? t('editSchool') : t('addSchool')}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            {(['name', 'city', 'phone', 'address'] as const).map(field => (
              <div key={field}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t(field === 'name' ? 'schoolName' : field === 'city' ? 'city' : field === 'phone' ? 'phone' : 'address')}</label>
                <input value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            ))}
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolsPage;
