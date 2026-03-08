import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { FileText, Printer, Download, Users, UserCheck, UserX, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];

const ReportsPage = () => {
  const { t } = useLanguage();
  const { students, payments, expenses } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const year = new Date().getFullYear();
  const monthName = months[selectedMonth];

  const stats = useMemo(() => {
    const mp = payments.filter(p => p.month === monthName && p.year === year);
    const me = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === selectedMonth && d.getFullYear() === year; });
    const paid = mp.filter(p => p.status === 'paid');
    const unpaid = mp.filter(p => p.status === 'unpaid');
    const income = paid.reduce((s, p) => s + p.amount, 0);
    const totalExp = me.reduce((s, e) => s + e.amount, 0);
    return {
      totalStudents: students.filter(s => s.status === 'active').length,
      paidCount: paid.length, unpaidCount: unpaid.length,
      income, totalExp, netProfit: income - totalExp,
    };
  }, [students, payments, expenses, selectedMonth, year, monthName]);

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    const csv = `Metric,Value\nTotal Students,${stats.totalStudents}\nPaid,${stats.paidCount}\nUnpaid,${stats.unpaidCount}\nIncome,${stats.income}\nExpenses,${stats.totalExp}\nNet Profit,${stats.netProfit}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `report-${monthName}-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Report</title><style>body{font-family:sans-serif;padding:40px;} .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;} h1{margin-bottom:20px;}</style></head><body>
      <h1>📊 ${t('monthlyReport')} - ${t(monthName as any)} ${year}</h1>
      <div class="row"><span>${t('totalStudents')}</span><span>${stats.totalStudents}</span></div>
      <div class="row"><span>${t('paidStudents')}</span><span>${stats.paidCount}</span></div>
      <div class="row"><span>${t('unpaidStudents')}</span><span>${stats.unpaidCount}</span></div>
      <div class="row"><span>${t('totalIncome')}</span><span>؋${stats.income.toLocaleString()}</span></div>
      <div class="row"><span>${t('totalExpenses')}</span><span>؋${stats.totalExp.toLocaleString()}</span></div>
      <div class="row"><strong>${t('netProfit')}</strong><strong>؋${stats.netProfit.toLocaleString()}</strong></div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  const cards = [
    { label: t('totalStudents'), value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { label: t('paidStudents'), value: stats.paidCount, icon: UserCheck, color: 'bg-green-500' },
    { label: t('unpaidStudents'), value: stats.unpaidCount, icon: UserX, color: 'bg-red-500' },
    { label: t('totalIncome'), value: `؋${stats.income.toLocaleString()}`, icon: TrendingUp, color: 'bg-teal-500' },
    { label: t('totalExpenses'), value: `؋${stats.totalExp.toLocaleString()}`, icon: TrendingDown, color: 'bg-orange-500' },
    { label: t('netProfit'), value: `؋${stats.netProfit.toLocaleString()}`, icon: DollarSign, color: stats.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg text-foreground">{t('monthlyReport')}</h2>

      <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
        {months.map((m, i) => <option key={m} value={i}>{t(m as any)}</option>)}
      </select>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${card.color} p-2.5 rounded-xl`}><card.icon size={20} className="text-white" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={handleExportPdf} className="bg-primary text-primary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <FileText size={18} />{t('exportPdf')}
        </button>
        <button onClick={handlePrint} className="bg-secondary text-secondary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <Printer size={18} />{t('printReport')}
        </button>
        <button onClick={handleExportExcel} className="bg-secondary text-secondary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <Download size={18} />{t('exportExcel')}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
