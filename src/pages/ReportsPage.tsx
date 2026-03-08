import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { FileText, Printer, Download, Users, TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, PieChart } from 'lucide-react';
import { fmtAFN, toCSV, downloadFile, printHTML } from '@/lib/helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toShamsi, formatShamsiMonth, getShamsiMonthsRange } from '@/lib/shamsi';
import type { FeeType, ExpenseCategory } from '@/types';

const ReportsPage = () => {
  const { t, lang } = useLanguage();
  const { schools, students, payments, expenses } = useData();
  const [schoolFilter, setSchoolFilter] = useState('');

  // Filter data by school
  const filteredPayments = useMemo(() => 
    schoolFilter ? payments.filter(p => p.schoolId === schoolFilter) : payments,
  [payments, schoolFilter]);
  
  const filteredExpenses = useMemo(() => 
    schoolFilter ? expenses.filter(e => e.schoolId === schoolFilter) : expenses,
  [expenses, schoolFilter]);
  
  const filteredStudents = useMemo(() => 
    schoolFilter ? students.filter(s => s.schoolId === schoolFilter) : students,
  [students, schoolFilter]);

  // Basic stats
  const stats = useMemo(() => {
    const income = filteredPayments.reduce((s, p) => s + p.finalAmount, 0);
    const totalExp = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    return {
      totalStudents: filteredStudents.filter(s => s.status === 'active').length,
      income,
      totalExp,
      netProfit: income - totalExp,
    };
  }, [filteredStudents, filteredPayments, filteredExpenses]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expenses: number; month: string }> = {};
    
    filteredPayments.forEach(p => {
      const { year, month } = toShamsi(new Date(p.date));
      const key = `${year}-${month}`;
      if (!months[key]) months[key] = { income: 0, expenses: 0, month: formatShamsiMonth(year, month, lang) };
      months[key].income += p.finalAmount;
    });
    
    filteredExpenses.forEach(e => {
      const { year, month } = toShamsi(new Date(e.date));
      const key = `${year}-${month}`;
      if (!months[key]) months[key] = { income: 0, expenses: 0, month: formatShamsiMonth(year, month, lang) };
      months[key].expenses += e.amount;
    });
    
    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
      .map(([, data]) => data);
  }, [filteredPayments, filteredExpenses, lang]);

  // Fee type breakdown
  const feeTypeData = useMemo(() => {
    const types: Record<FeeType, number> = { tuition: 0, transportation: 0, registration: 0 };
    filteredPayments.forEach(p => {
      types[p.feeType] += p.finalAmount;
    });
    return [
      { type: t('tuition'), amount: types.tuition, color: 'bg-blue-500' },
      { type: t('transportation'), amount: types.transportation, color: 'bg-teal-500' },
      { type: t('registration'), amount: types.registration, color: 'bg-purple-500' },
    ];
  }, [filteredPayments, t]);

  // Expense category breakdown
  const expenseCategoryData = useMemo(() => {
    const cats: Record<ExpenseCategory, number> = { salary: 0, electricity: 0, rent: 0, maintenance: 0, supplies: 0, other: 0 };
    filteredExpenses.forEach(e => {
      cats[e.category] += e.amount;
    });
    const catColors: Record<ExpenseCategory, string> = {
      salary: 'bg-red-500',
      electricity: 'bg-yellow-500',
      rent: 'bg-orange-500',
      maintenance: 'bg-indigo-500',
      supplies: 'bg-pink-500',
      other: 'bg-gray-500',
    };
    return Object.entries(cats)
      .filter(([, amount]) => amount > 0)
      .map(([cat, amount]) => ({
        category: t(cat as ExpenseCategory),
        amount,
        color: catColors[cat as ExpenseCategory],
      }));
  }, [filteredExpenses, t]);

  // Unpaid fees summary
  const unpaidSummary = useMemo(() => {
    const activeStudents = filteredStudents.filter(s => s.status === 'active');
    let totalUnpaid = 0;
    let studentsWithUnpaid = 0;
    const feeTypes: FeeType[] = ['tuition', 'transportation', 'registration'];
    
    activeStudents.forEach(student => {
      const studentPayments = filteredPayments.filter(p => p.studentId === student.id);
      const monthsRange = getShamsiMonthsRange(student.entryDate);
      let hasUnpaid = false;
      
      feeTypes.forEach(feeType => {
        monthsRange.forEach(({ year, month }) => {
          const paid = studentPayments.some(
            p => p.feeType === feeType && 
            toShamsi(new Date(p.date)).year === year && 
            toShamsi(new Date(p.date)).month === month
          );
          if (!paid) {
            hasUnpaid = true;
            // Estimate unpaid amount (could be improved with actual fee schedules)
            totalUnpaid += feeType === 'tuition' ? 5000 : feeType === 'transportation' ? 1500 : 500;
          }
        });
      });
      
      if (hasUnpaid) studentsWithUnpaid++;
    });
    
    return { totalUnpaid, studentsWithUnpaid, totalActive: activeStudents.length };
  }, [filteredStudents, filteredPayments]);

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
      <h2 style="margin-top:24px">📅 ${t('monthlyBreakdown')}</h2>
      <table><thead><tr><th>${t('month')}</th><th>${t('income')}</th><th>${t('expenses')}</th><th>${t('profit')}</th></tr></thead>
      <tbody>${monthlyData.map(m => `<tr><td>${m.month}</td><td>${fmtAFN(m.income)}</td><td>${fmtAFN(m.expenses)}</td><td>${fmtAFN(m.income - m.expenses)}</td></tr>`).join('')}</tbody></table>
    `);
  };

  const totalFeeAmount = feeTypeData.reduce((s, f) => s + f.amount, 0);
  const totalExpenseAmount = expenseCategoryData.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg text-foreground">{t('reports')}</h2>

      <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
        <option value="">{t('allSchools')}</option>
        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {/* Summary Cards */}
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

      {/* Unpaid Fees Alert */}
      {unpaidSummary.studentsWithUnpaid > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive p-2.5 rounded-xl">
              <AlertCircle size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{t('unpaidFees')}</p>
              <p className="text-xs text-muted-foreground">
                {unpaidSummary.studentsWithUnpaid} / {unpaidSummary.totalActive} {t('students')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-destructive">~{fmtAFN(unpaidSummary.totalUnpaid)}</p>
              <p className="text-xs text-muted-foreground">{t('estimated')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="monthly" className="text-xs gap-1">
            <Calendar size={14} /> {t('monthly')}
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-xs gap-1">
            <TrendingUp size={14} /> {t('fees')}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-xs gap-1">
            <PieChart size={14} /> {t('expenses')}
          </TabsTrigger>
        </TabsList>

        {/* Monthly Breakdown */}
        <TabsContent value="monthly" className="mt-3 space-y-2">
          {monthlyData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{t('noData')}</p>
          ) : (
            monthlyData.map((m, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3">
                <p className="font-medium text-sm text-foreground mb-2">{m.month}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t('income')}</p>
                    <p className="font-semibold text-green-600">{fmtAFN(m.income)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('expenses')}</p>
                    <p className="font-semibold text-red-600">{fmtAFN(m.expenses)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('profit')}</p>
                    <p className={`font-semibold ${m.income - m.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtAFN(m.income - m.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Fee Type Breakdown */}
        <TabsContent value="fees" className="mt-3 space-y-3">
          {feeTypeData.map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{f.type}</span>
                <span className="text-sm font-bold text-foreground">{fmtAFN(f.amount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${f.color} rounded-full transition-all`}
                  style={{ width: totalFeeAmount > 0 ? `${(f.amount / totalFeeAmount) * 100}%` : '0%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalFeeAmount > 0 ? ((f.amount / totalFeeAmount) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t('total')}</span>
              <span className="text-lg font-bold text-primary">{fmtAFN(totalFeeAmount)}</span>
            </div>
          </div>
        </TabsContent>

        {/* Expense Categories */}
        <TabsContent value="expenses" className="mt-3 space-y-3">
          {expenseCategoryData.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">{t('noData')}</p>
          ) : (
            expenseCategoryData.map((e, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{e.category}</span>
                  <span className="text-sm font-bold text-foreground">{fmtAFN(e.amount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${e.color} rounded-full transition-all`}
                    style={{ width: totalExpenseAmount > 0 ? `${(e.amount / totalExpenseAmount) * 100}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalExpenseAmount > 0 ? ((e.amount / totalExpenseAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))
          )}
          {expenseCategoryData.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('total')}</span>
                <span className="text-lg font-bold text-destructive">{fmtAFN(totalExpenseAmount)}</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Export Buttons */}
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
