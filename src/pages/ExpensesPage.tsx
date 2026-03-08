import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import type { Expense, ExpenseCategory } from '@/types';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import { formatShamsi } from '@/lib/shamsi';
import { fmtAFN } from '@/lib/helpers';
import ConfirmDialog from '@/components/ConfirmDialog';

const categories: ExpenseCategory[] = ['salary', 'electricity', 'rent', 'maintenance', 'supplies', 'other'];
const catKey: Record<ExpenseCategory, string> = { salary:'salaryExp', electricity:'electricity', rent:'rent', maintenance:'maintenance', supplies:'supplies', other:'other' };
const roleKey: Record<string, string> = { teacher:'teacher', guard:'guard', admin_staff:'adminStaff', cleaner:'cleaner', driver:'driver', other:'other' };

const emptyForm = () => ({
  schoolId: '', category: 'salary' as ExpenseCategory, amount: 0,
  description: '', personName: '', date: new Date().toISOString().split('T')[0],
  billNumber: '', staffId: '',
});

const ExpensesPage = () => {
  const { t, lang } = useLanguage();
  const { schools, expenses, staffList, addExpense, updateExpense, deleteExpense } = useData();
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = useMemo(() => {
    let list = [...expenses];
    if (schoolFilter) list = list.filter(e => e.schoolId === schoolFilter);
    if (search) list = list.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || e.personName.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, schoolFilter, search]);

  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  const openAdd = () => { setForm({ ...emptyForm(), schoolId: schools[0]?.id || '' }); setEditing(null); setShowForm(true); };
  const openEdit = (e: Expense) => {
    setForm({ schoolId: e.schoolId, category: e.category, amount: e.amount,
      description: e.description, personName: e.personName, date: e.date,
      billNumber: e.billNumber, staffId: e.staffId || '' });
    setEditing(e); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.schoolId || !form.amount) return;
    const data = { ...form, staffId: form.staffId || undefined };
    if (editing) updateExpense({ ...editing, ...data });
    else addExpense(data);
    setShowForm(false);
  };

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

      <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground">
        <option value="">{t('allSchools')}</option>
        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">{t(catKey[e.category] as any)}</p>
              <p className="text-xs text-muted-foreground">{schoolName(e.schoolId)} · {formatShamsi(e.date, lang)}</p>
              {e.personName && <p className="text-xs text-muted-foreground">{e.personName}</p>}
              {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground">{fmtAFN(e.amount)}</span>
              <button onClick={() => openEdit(e)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
              <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!deleteId} title={t('delete')} message={t('deleteConfirm')}
        onConfirm={() => { if (deleteId) deleteExpense(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{editing ? t('editExpense') : t('addExpense')}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('school')}</label>
              <select value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                <option value="">—</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('category')}</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                {categories.map(c => <option key={c} value={c}>{t(catKey[c] as any)}</option>)}
              </select>
            </div>
            {[{k:'amount',l:'amount',tp:'number'},{k:'personName',l:'personName',tp:'text'},{k:'description',l:'description',tp:'text'},{k:'billNumber',l:'billNumber',tp:'text'}].map(f => (
              <div key={f.k}>
                <label className="text-xs font-medium text-muted-foreground">{t(f.l as any)}</label>
                <input type={f.tp} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: f.tp === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('date')}</label>
              <ShamsiDatePicker value={form.date} onChange={d => setForm({ ...form, date: d })} />
            </div>
            {form.category === 'salary' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('staffMember')}</label>
                <select value={form.staffId} onChange={e => setForm({ ...form, staffId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                  <option value="">—</option>
                  {staffList.filter(s => s.schoolId === form.schoolId && s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExpensesPage;
