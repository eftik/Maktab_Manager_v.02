import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Plus, Trash2, X } from 'lucide-react';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import { formatShamsi } from '@/lib/shamsi';

const expenseTypes = ['teacherSalary','driverSalary','guardSalary','cleanerSalary','electricity','internet','water','other'] as const;

const ExpensesPage = () => {
  const { t, lang } = useLanguage();
  const { schools, expenses, addExpense, deleteExpense } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: expenseTypes[0] as string, amount: '', date: new Date().toISOString().split('T')[0], note: '', schoolId: '' });

  const handleSave = () => {
    if (!form.amount || !form.schoolId) return;
    addExpense({ ...form, amount: Number(form.amount) });
    setShowForm(false);
  };

  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  return (
    <div className="p-4 space-y-4">
      <button onClick={() => { setForm({ type: expenseTypes[0], amount: '', date: new Date().toISOString().split('T')[0], note: '', schoolId: schools[0]?.id || '' }); setShowForm(true); }}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2">
        <Plus size={18} />{t('addExpense')}
      </button>

      {expenses.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-2">
        {expenses.map(e => (
          <div key={e.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">{t(e.type as any)}</p>
              <p className="text-xs text-muted-foreground">{schoolName(e.schoolId)} · {formatShamsi(e.date, lang)}</p>
              {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">؋{e.amount.toLocaleString()}</span>
              <button onClick={() => { if (confirm(t('confirm'))) deleteExpense(e.id); }} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{t('addExpense')}</h2>
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
              <label className="text-xs font-medium text-muted-foreground">{t('type')}</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                {expenseTypes.map(et => <option key={et} value={et}>{t(et as any)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('amount')}</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('date')}</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('note')}</label>
              <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
