import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { School, Users, CreditCard, TrendingUp, TrendingDown, DollarSign, UserCheck, UserX } from 'lucide-react';

const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];

const HomePage = () => {
  const { t } = useLanguage();
  const { schools, students, payments, expenses } = useData();
  const currentMonth = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const currentYear = new Date().getFullYear();

  const monthName = months[selectedMonth];

  const stats = useMemo(() => {
    const monthPayments = payments.filter(p => p.month === monthName && p.year === currentYear);
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
    });
    const paidCount = monthPayments.filter(p => p.status === 'paid').length;
    const unpaidCount = monthPayments.filter(p => p.status === 'unpaid').length;
    const income = monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalExp = monthExpenses.reduce((s, e) => s + e.amount, 0);

    return {
      totalSchools: schools.length,
      totalStudents: students.filter(s => s.status === 'active').length,
      paidCount, unpaidCount, income, totalExp,
      netProfit: income - totalExp,
    };
  }, [schools, students, payments, expenses, selectedMonth, currentYear, monthName]);

  const cards = [
    { label: t('totalSchools'), value: stats.totalSchools, icon: School, color: 'bg-blue-500' },
    { label: t('totalStudents'), value: stats.totalStudents, icon: Users, color: 'bg-emerald-500' },
    { label: t('paidStudents'), value: stats.paidCount, icon: UserCheck, color: 'bg-green-500' },
    { label: t('unpaidStudents'), value: stats.unpaidCount, icon: UserX, color: 'bg-red-500' },
    { label: t('totalIncome'), value: `؋${stats.income.toLocaleString()}`, icon: TrendingUp, color: 'bg-teal-500' },
    { label: t('totalExpenses'), value: `؋${stats.totalExp.toLocaleString()}`, icon: TrendingDown, color: 'bg-orange-500' },
    { label: t('netProfit'), value: `؋${stats.netProfit.toLocaleString()}`, icon: DollarSign, color: stats.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Month selector */}
      <select
        value={selectedMonth}
        onChange={e => setSelectedMonth(Number(e.target.value))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground focus:ring-2 focus:ring-primary"
      >
        {months.map((m, i) => (
          <option key={m} value={i}>{t(m as any)}</option>
        ))}
      </select>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div key={i} className={`rounded-2xl p-4 shadow-sm ${i === cards.length - 1 ? 'col-span-2' : ''} bg-card border border-border`}>
            <div className="flex items-center gap-3">
              <div className={`${card.color} p-2.5 rounded-xl`}>
                <card.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
