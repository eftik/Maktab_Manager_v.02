import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { FileText, Printer, Download, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { fmtAFN, toCSV, downloadFile, printHTML } from '@/lib/helpers';

const ReportsPage = () => {
  const { t } = useLanguage();
  const { schools, students, payments, expenses } = useData();
  const [schoolFilter, setSchoolFilter] = useState('');

  const stats = useMemo(() => {
    const fp = schoolFilter ? payments.filter(p => p.schoolId === schoolFilter) : payments;
    const fe = schoolFilter ? expenses.filter(e => e.schoolId === schoolFilter) : expenses;
    const fs = schoolFilter ? students.filter(s => s.schoolId === schoolFilter) : students;
    const income = fp.reduce((s, p) => s + p.finalAmount, 0);
    const totalExp = fe.reduce((s, e) => s + e.amount, 0);
    return {
      totalStudents: fs.filter(s => s.status === 'active').length,
      income, totalExp, netProfit: income - totalExp,
    };
  }, [students, payments, expenses, schoolFilter]);

  const cards = [
    { label: t('totalStudents'), value: stats.totalStudents, icon: Users, color: 'bg-blue-500' },
    { label: t('totalIncome'), value: fmtAFN(stats.income), icon: TrendingUp, color: 'bg-teal-500' },
    { label: t('totalExpenses'), value: fmtAFN(stats.totalExp), icon: TrendingDown, color: 'bg-orange-500' },
    { label: t('netProfit'), value: fmtAFN(stats.netProfit), icon: DollarSign, color: stats.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
  ];

  const handleExportCsv = () => {
    const csv = toCSV(
      ['Metric', 'Value'],
      [['Students', String(stats.totalStudents)], ['Income', String(stats.income)], ['Expenses', String(stats.totalExp)], ['Profit', String(stats.netProfit)]]
    );
    downloadFile(csv, 'report.csv');
  };

  const handlePrint = () => {
    printHTML(t('monthlyReport'), `
      <h1>📊 ${t('monthlyReport')}</h1>
      <div class="row"><span>${t('totalStudents')}</span><span>${stats.totalStudents}</span></div>
      <div class="row"><span>${t('totalIncome')}</span><span>${fmtAFN(stats.income)}</span></div>
      <div class="row"><span>${t('totalExpenses')}</span><span>${fmtAFN(stats.totalExp)}</span></div>
      <div class="row"><strong>${t('netProfit')}</strong><strong>${fmtAFN(stats.netProfit)}</strong></div>
    `);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg text-foreground">{t('reports')}</h2>

      <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
        <option value="">{t('allSchools')}</option>
        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
        <button onClick={handlePrint} className="bg-primary text-primary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <FileText size={18} />{t('exportPdf')}
        </button>
        <button onClick={() => window.print()} className="bg-secondary text-secondary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <Printer size={18} />{t('printReport')}
        </button>
        <button onClick={handleExportCsv} className="bg-secondary text-secondary-foreground py-3 rounded-xl text-xs font-medium flex flex-col items-center gap-1">
          <Download size={18} />{t('exportCsv')}
        </button>
      </div>
    </div>
  );
};
export default ReportsPage;
