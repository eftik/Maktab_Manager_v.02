import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { School as SchoolIcon, Users, TrendingUp, TrendingDown, DollarSign, UserCheck, UserX } from 'lucide-react';
import { fmtAFN } from '@/lib/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HomePage = () => {
  const { t } = useLanguage();
  const { schools, students, payments, expenses } = useData();

  const stats = useMemo(() => {
    const totalIncome = payments.reduce((s, p) => s + p.finalAmount, 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      totalSchools: schools.length,
      totalStudents: students.filter(s => s.status === 'active').length,
      totalIncome, totalExp, netProfit: totalIncome - totalExp,
    };
  }, [schools, students, payments, expenses]);

  const chartData = useMemo(() => {
    return schools.map(sch => {
      const income = payments.filter(p => p.schoolId === sch.id).reduce((s, p) => s + p.finalAmount, 0);
      const exp = expenses.filter(e => e.schoolId === sch.id).reduce((s, e) => s + e.amount, 0);
      return { name: sch.name.substring(0, 12), income, expenses: exp, profit: income - exp };
    });
  }, [schools, payments, expenses]);

  const cards = [
    { label: t('totalSchools'), value: stats.totalSchools, icon: SchoolIcon, color: 'bg-blue-500' },
    { label: t('totalStudents'), value: stats.totalStudents, icon: Users, color: 'bg-emerald-500' },
    { label: t('totalIncome'), value: fmtAFN(stats.totalIncome), icon: TrendingUp, color: 'bg-teal-500' },
    { label: t('totalExpenses'), value: fmtAFN(stats.totalExp), icon: TrendingDown, color: 'bg-orange-500' },
    { label: t('netProfit'), value: fmtAFN(stats.netProfit), icon: DollarSign, color: stats.netProfit >= 0 ? 'bg-green-600' : 'bg-red-600' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-bold text-lg text-foreground">{t('dashboard')}</h2>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div key={i} className={`rounded-2xl p-4 shadow-sm bg-card border border-border ${i === cards.length - 1 ? 'col-span-2' : ''}`}>
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

      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('income')} vs {t('expenses')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name={t('income')} fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name={t('expenses')} fill="hsl(0 72% 51%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
export default HomePage;
