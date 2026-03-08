import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import type { Payment, FeeType } from '@/types';
import { Plus, Search, Edit2, Trash2, X, FileText, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import { formatShamsi } from '@/lib/shamsi';
import { fmtAFN, printHTML, toWestern } from '@/lib/helpers';
import ConfirmDialog from '@/components/ConfirmDialog';

const feeTypes: FeeType[] = ['tuition', 'transportation', 'registration'];

const emptyForm = () => ({
  studentId: '', schoolId: '', feeType: 'tuition' as FeeType,
  amount: 0, discount: 0, finalAmount: 0, date: new Date().toISOString().split('T')[0],
  note: '', billNumber: '',
});

const FeesPage = () => {
  const { t, lang } = useLanguage();
  const { students, schools, payments, addPayment, updatePayment, deletePayment } = useData();
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [form, setForm] = useState(emptyForm());

  const activeStudents = students.filter(s => s.status === 'active');

  const filtered = useMemo(() => {
    let list = [...payments];
    if (schoolFilter) list = list.filter(p => p.schoolId === schoolFilter);
    if (search) list = list.filter(p => {
      const s = students.find(st => st.id === p.studentId);
      return s?.name.toLowerCase().includes(search.toLowerCase());
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, schoolFilter, search, students]);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setShowForm(true); };
  const openEdit = (p: Payment) => {
    setForm({ studentId: p.studentId, schoolId: p.schoolId, feeType: p.feeType,
      amount: p.amount, discount: p.discount, finalAmount: p.finalAmount,
      date: p.date, note: p.note, billNumber: p.billNumber });
    setEditing(p); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.studentId || !form.schoolId) return;
    const final = form.amount - form.discount;
    const data = { ...form, finalAmount: final > 0 ? final : 0 };
    if (editing) updatePayment({ ...editing, ...data });
    else { addPayment(data); setReceipt({ ...data, id: 'temp' } as Payment); }
    setShowForm(false);
  };

  const handleStudentChange = (studentId: string) => {
    const s = students.find(st => st.id === studentId);
    setForm({ ...form, studentId, schoolId: s?.schoolId || form.schoolId });
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name || '';
  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  const sendWhatsApp = (p: Payment) => {
    const s = students.find(st => st.id === p.studentId);
    if (!s) return;
    const msg = encodeURIComponent(`محترم والد صاحب،\nفیس شاگرد ${s.name} به مبلغ ${p.finalAmount} افغانی پرداخت نشده است.\nلطفا پرداخت نمایید.`);
    window.open(`https://wa.me/${(s.parentPhone || '').replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const showReceipt = (p: Payment) => {
    const s = students.find(st => st.id === p.studentId);
    printHTML(t('receipt'), `
      <h1>🧾 ${t('receipt')}</h1>
      <div class="row"><span>${t('student')}:</span><span>${s?.name || ''}</span></div>
      <div class="row"><span>${t('school')}:</span><span>${schoolName(p.schoolId)}</span></div>
      <div class="row"><span>${t('feeType')}:</span><span>${t(p.feeType)}</span></div>
      <div class="row"><span>${t('amount')}:</span><span>${fmtAFN(p.amount)}</span></div>
      <div class="row"><span>${t('discount')}:</span><span>${fmtAFN(p.discount)}</span></div>
      <div class="row"><span>${t('finalAmount')}:</span><span>${fmtAFN(p.finalAmount)}</span></div>
      <div class="row"><span>${t('date')}:</span><span>${formatShamsi(p.date, lang)}</span></div>
      <div class="row"><span>${t('billNumber')}:</span><span>${p.billNumber}</span></div>
    `);
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
        {filtered.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{studentName(p.studentId)}</p>
                <p className="text-xs text-muted-foreground">{schoolName(p.schoolId)} · {t(p.feeType)}</p>
                <p className="text-xs text-muted-foreground mt-1">{fmtAFN(p.finalAmount)} · {formatShamsi(p.date, lang)}</p>
                {p.billNumber && <p className="text-xs text-muted-foreground">#{p.billNumber}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => showReceipt(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><FileText size={16} /></button>
                <button onClick={() => sendWhatsApp(p)} className="p-2 rounded-lg hover:bg-muted text-green-600"><MessageCircle size={16} /></button>
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
                <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!deleteId} title={t('delete')} message={t('deleteConfirm')}
        onConfirm={() => { if (deleteId) deletePayment(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{editing ? t('editFee') : t('addFee')}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('student')}</label>
              <select value={form.studentId} onChange={e => handleStudentChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                <option value="">—</option>
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({schoolName(s.schoolId)})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('feeType')}</label>
              <select value={form.feeType} onChange={e => setForm({ ...form, feeType: e.target.value as FeeType })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                {feeTypes.map(ft => <option key={ft} value={ft}>{t(ft)}</option>)}
              </select>
            </div>
            {[{k:'amount',l:'amount',t:'number'},{k:'discount',l:'discount',t:'number'},{k:'billNumber',l:'billNumber',t:'text'},{k:'note',l:'note',t:'text'}].map(f => (
              <div key={f.k}>
                <label className="text-xs font-medium text-muted-foreground">{t(f.l as any)}</label>
                <input type={f.t} value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: f.t === 'number' ? Number(e.target.value) : e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('date')}</label>
              <ShamsiDatePicker value={form.date} onChange={d => setForm({ ...form, date: d })} />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default FeesPage;
