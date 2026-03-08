import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatShamsi } from '@/lib/shamsi';
import { useData } from '@/contexts/DataContext';
import { CheckCircle, MessageCircle, FileText, Filter } from 'lucide-react';

const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];

const FeesPage = () => {
  const { t, lang } = useLanguage();
  const { students, schools, payments, updatePayment, generateMonthlyFees } = useData();
  const [monthFilter, setMonthFilter] = useState(months[new Date().getMonth()]);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const year = new Date().getFullYear();

  const filtered = useMemo(() => {
    let list = payments.filter(p => p.month === monthFilter && p.year === year);
    if (showUnpaidOnly) list = list.filter(p => p.status === 'unpaid');
    return list;
  }, [payments, monthFilter, year, showUnpaidOnly]);

  const handleGenerate = () => generateMonthlyFees(monthFilter, year);

  const handleMarkPaid = (id: string) => {
    const now = new Date().toISOString().split('T')[0];
    updatePayment(id, { status: 'paid', datePaid: now });
    const p = payments.find(x => x.id === id);
    if (p) {
      const student = students.find(s => s.id === p.studentId);
      const school = schools.find(s => s.id === p.schoolId);
      setReceipt({ studentName: student?.name, schoolName: school?.name, month: p.month, amount: p.amount, datePaid: now });
    }
  };

  const sendWhatsApp = (studentId: string, phone?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const msg = encodeURIComponent(`محترم والد صاحب،\nفیس ماه جاری شاگرد ${student.name} هنوز پرداخت نشده است.\nلطفا پرداخت نمایید.`);
    window.open(`https://wa.me/${(student.phone || '').replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name || '';
  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  const printReceipt = () => {
    const w = window.open('', '_blank');
    if (!w || !receipt) return;
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:sans-serif;padding:40px;} h1{color:#1a1a1a;} .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;}</style></head><body>
      <h1>🏫 ${t('receipt')}</h1>
      <div class="row"><span>${t('student')}:</span><span>${receipt.studentName}</span></div>
      <div class="row"><span>${t('school')}:</span><span>${receipt.schoolName}</span></div>
      <div class="row"><span>${t('month')}:</span><span>${receipt.month}</span></div>
      <div class="row"><span>${t('amount')}:</span><span>؋${receipt.amount?.toLocaleString()}</span></div>
      <div class="row"><span>${t('paymentDate')}:</span><span>${receipt.datePaid}</span></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground">
          {months.map(m => <option key={m} value={m}>{t(m as any)}</option>)}
        </select>
        <button onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
          className={`p-2.5 rounded-xl border ${showUnpaidOnly ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
          <Filter size={18} />
        </button>
      </div>

      <button onClick={handleGenerate} className="w-full bg-primary/10 text-primary py-2.5 rounded-xl text-sm font-medium border border-primary/20">
        {t('generateFees')}
      </button>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-foreground">{studentName(p.studentId)}</p>
                <p className="text-xs text-muted-foreground">{schoolName(p.schoolId)}</p>
                <p className="text-xs text-muted-foreground mt-1">؋{p.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {p.status === 'unpaid' ? (
                  <>
                    <button onClick={() => handleMarkPaid(p.id)} className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600"><CheckCircle size={18} /></button>
                    <button onClick={() => sendWhatsApp(p.studentId)} className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600"><MessageCircle size={18} /></button>
                  </>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t('paid')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg text-foreground text-center">🧾 {t('receipt')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">{t('student')}</span><span className="font-medium text-foreground">{receipt.studentName}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">{t('school')}</span><span className="font-medium text-foreground">{receipt.schoolName}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">{t('month')}</span><span className="font-medium text-foreground">{receipt.month}</span></div>
              <div className="flex justify-between border-b border-border pb-2"><span className="text-muted-foreground">{t('amount')}</span><span className="font-medium text-foreground">؋{receipt.amount?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('paymentDate')}</span><span className="font-medium text-foreground">{receipt.datePaid ? formatShamsi(receipt.datePaid, lang) : ''}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={printReceipt} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <FileText size={16} />{t('downloadPdf')}
              </button>
              <button onClick={() => setReceipt(null)} className="flex-1 border border-border py-2.5 rounded-xl text-sm font-medium text-foreground">{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeesPage;
